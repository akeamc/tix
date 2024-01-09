use std::num::NonZeroUsize;

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts, Path, Query, State},
    http::{request::Parts, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use lettre::{
    message::Mailbox, transport::smtp::authentication::Credentials, AsyncSmtpTransport,
    Tokio1Executor,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgQueryResult, PgPool};
use tix_api::{
    email::send_order_confirmation,
    order::{Order, OrderId},
};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::error;
use uuid::Uuid;

#[derive(Debug, Parser)]
struct Options {
    #[clap(long, env, hide_env_values = true)]
    database_url: String,
    #[clap(long, env)]
    gmail_username: String,
    #[clap(long, env, hide_env_values = true)]
    gmail_password: String,
}

#[derive(Debug, Clone)]
struct AppState {
    pool: PgPool,
    smtp: AsyncSmtpTransport<Tokio1Executor>,
}

#[derive(Debug, thiserror::Error)]
enum Error {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("too many tickets")]
    TooManyTickets,
    #[error("order already paid")]
    AlreadyPaid,
    #[error("order canceled")]
    OrderCanceled,
    #[error("SMTP error")]
    Smtp(#[from] lettre::transport::smtp::Error),
    #[error("order not found")]
    OrderNotFound,
}

impl IntoResponse for Error {
    fn into_response(self) -> axum::response::Response {
        let status = match &self {
            Self::Database(e) => {
                error!(?e);
                StatusCode::INTERNAL_SERVER_ERROR
            }
            Self::Smtp(e) => {
                error!(?e);
                StatusCode::INTERNAL_SERVER_ERROR
            }
            Self::AlreadyPaid | Self::TooManyTickets | Self::OrderCanceled => {
                StatusCode::BAD_REQUEST
            }
            Self::OrderNotFound => StatusCode::NOT_FOUND,
        };

        (status, self.to_string()).into_response()
    }
}

type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Debug, Serialize)]
struct Ticket {
    id: Uuid,
    order_id: OrderId,
}

#[derive(Debug, Deserialize)]
struct CreateOrder {
    email: String,
    name: String,
    phone: String,
    count: NonZeroUsize,
}

struct AuthedOrder {
    order: Order,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthedOrder
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        #[derive(Debug, Deserialize)]
        struct PathParams {
            order_id: OrderId,
        }

        #[derive(Debug, Deserialize)]
        struct QueryParams {
            email: String,
        }

        let state = AppState::from_ref(state);
        let Path(PathParams { order_id }) = Path::from_request_parts(parts, &state).await.unwrap();
        let Query(QueryParams { email }) = Query::from_request_parts(parts, &state).await.unwrap();

        let order = sqlx::query_as!(
            Order,
            "SELECT * FROM orders WHERE id = $1 AND email = $2",
            order_id.as_ref(),
            email,
        )
        .fetch_optional(&state.pool)
        .await?.ok_or(Error::OrderNotFound)?;

        Ok(Self { order })
    }
}

async fn insert_tickets(
    executor: impl sqlx::PgExecutor<'_>,
    order_id: OrderId,
    count: usize,
) -> sqlx::Result<PgQueryResult> {
    let mut query_builder = sqlx::QueryBuilder::new("INSERT INTO tickets (id, order_id) ");

    query_builder.push_values(
        std::iter::repeat_with(Uuid::new_v4).take(count),
        |mut b, ticket_id| {
            b.push_bind(ticket_id).push_bind(&order_id);
        },
    );

    let query = query_builder.build();

    query.execute(executor).await
}

async fn tickets_remaining(executor: impl sqlx::PgExecutor<'_>) -> sqlx::Result<i64> {
    // count the number of tickets with a NULL order.canceled_at
    let count = sqlx::query!("SELECT COUNT(*) FROM tickets LEFT JOIN orders ON tickets.order_id = orders.id WHERE orders.canceled_at IS NULL").fetch_one(executor).await?.count.unwrap_or(0);

    Ok(266 - count)
}

async fn get_tickets_remaining(State(state): State<AppState>) -> Result<impl IntoResponse> {
    let remaining = tickets_remaining(&state.pool).await?;

    Ok(Json(remaining))
}

async fn create_order(
    State(state): State<AppState>,
    Json(req): Json<CreateOrder>,
) -> Result<impl IntoResponse> {
    let mut tx = state.pool.begin().await?;
    let CreateOrder {
        email,
        name,
        phone,
        count: tickets,
    } = req;

    let mbox = Mailbox::new(Some(name.clone()), email.parse().unwrap());

    if tickets.get() > 10 || tickets.get() > tickets_remaining(&mut *tx).await?.try_into().unwrap()
    {
        return Err(Error::TooManyTickets);
    }

    let order_id = OrderId::new();
    let amount = 115 * tickets.get() as i32;

    let order = sqlx::query_as!(
        Order,
        "INSERT INTO orders (id, email, name, phone, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        order_id.as_ref(),
        email,
        name,
        phone,
        amount,
    )
    .fetch_one(&mut *tx)
    .await?;

    insert_tickets(&mut *tx, order_id, tickets.get()).await?;

    send_order_confirmation(&state.smtp, mbox, &order).await?;

    tx.commit().await?;

    Ok((StatusCode::CREATED, Json(order)))
}

// async fn list_orders(State(state): State<AppState>) -> Result<impl IntoResponse> {
//     let orders = sqlx::query_as!(Order, "SELECT * FROM orders")
//         .fetch_all(&state.pool)
//         .await?;

//     Ok(Json(orders))
// }

async fn get_order(AuthedOrder { order }: AuthedOrder) -> Result<impl IntoResponse> {
    Ok(Json(order))
}

async fn complete_order(
    AuthedOrder { order }: AuthedOrder,
    State(state): State<AppState>,
) -> Result<impl IntoResponse> {
    if order.paid_at.is_some() {
        return Err(Error::AlreadyPaid);
    }

    if order.completed_at.is_some() {
        return Ok(Json(order));
    }

    let order = sqlx::query_as!(
        Order,
        "UPDATE orders SET completed_at = NOW() WHERE id = $1 RETURNING *",
        order.id.as_ref(),
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(order))
}

async fn cancel_order(
    AuthedOrder { order }: AuthedOrder,
    State(state): State<AppState>,
) -> Result<impl IntoResponse> {
    if order.canceled_at.is_some() {
        return Err(Error::OrderCanceled);
    }

    if order.completed_at.is_some() {
        return Ok(Json(order));
    }

    let order = sqlx::query_as!(
        Order,
        "UPDATE orders SET canceled_at = NOW() WHERE id = $1 RETURNING *",
        order.id.as_ref(),
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(order))
}

async fn get_tickets(
    AuthedOrder { order }: AuthedOrder,
    State(state): State<AppState>,
) -> Result<impl IntoResponse> {
    let tickets = sqlx::query_as!(
        Ticket,
        "SELECT * FROM tickets WHERE order_id = $1",
        order.id.as_ref(),
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(tickets))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();
    let options = Options::parse();
    let smtp = AsyncSmtpTransport::<Tokio1Executor>::relay("smtp-relay.gmail.com")?
        .credentials(Credentials::new(
            options.gmail_username,
            options.gmail_password,
        ))
        .build();
    let pool = PgPool::connect(&options.database_url).await?;
    sqlx::migrate!().run(&pool).await?;

    let app = Router::new()
        .route("/orders", post(create_order))
        .route("/orders/:order_id", get(get_order).delete(cancel_order))
        .route("/orders/:order_id/complete", post(complete_order))
        .route("/orders/:order_id/tickets", get(get_tickets))
        .route("/tickets/remaining", get(get_tickets_remaining))
        .layer(CorsLayer::very_permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(AppState { pool, smtp });

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
