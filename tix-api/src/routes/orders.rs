use std::{convert::TryInto, num::NonZeroUsize};

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use lettre::message::Mailbox;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgQueryResult, types::Uuid};

use crate::email::send_order_confirmation;
use crate::error::{Code, ResponseError, Result};
use crate::order::{Order, OrderId};
use crate::swish;

use super::auth::Identity;
use super::tickets::tickets_remaining;
use super::AppState;

#[derive(Debug, Serialize)]
pub struct Ticket {
    pub id: Uuid,
    pub order_id: OrderId,
}

#[derive(Debug, Deserialize)]
struct CreateOrder {
    email: String,
    name: String,
    phone: String,
    count: NonZeroUsize,
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

#[derive(Debug, thiserror::Error)]
pub enum CreateOrderError {
    #[error("too many tickets requested")]
    TooManyTickets,
}

impl From<CreateOrderError> for ResponseError {
    fn from(value: CreateOrderError) -> Self {
        match value {
            CreateOrderError::TooManyTickets => {
                Self::new(Code::TooManyTickets, "too many tickets requested")
            }
        }
    }
}

async fn create_order(state: AppState, Json(req): Json<CreateOrder>) -> Result<impl IntoResponse> {
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
        return Err(CreateOrderError::TooManyTickets.into());
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

async fn list_orders(state: AppState, _identity: Identity) -> Result<impl IntoResponse> {
    let orders = sqlx::query_as!(Order, "SELECT * FROM orders")
        .fetch_all(&state.pool)
        .await?;

    Ok(Json(orders))
}

async fn get_order(order: Order) -> Result<impl IntoResponse> {
    Ok(Json(order))
}

async fn complete_order(order: Order, state: AppState) -> Result<impl IntoResponse> {
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

#[derive(Debug, thiserror::Error)]
enum CancelOrderError {
    #[error("order completed")]
    OrderCompleted,
}

impl From<CancelOrderError> for ResponseError {
    fn from(value: CancelOrderError) -> Self {
        match value {
            CancelOrderError::OrderCompleted => Self::new(Code::OrderCompleted, "order completed"),
        }
    }
}

async fn cancel_order(order: Order, state: AppState) -> Result<impl IntoResponse> {
    if order.canceled_at.is_some() {
        return Ok(Json(order));
    }

    if order.completed_at.is_some() {
        return Err(CancelOrderError::OrderCompleted.into());
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

async fn get_tickets(order: Order, state: AppState) -> Result<impl IntoResponse> {
    let tickets = sqlx::query_as!(
        Ticket,
        "SELECT * FROM tickets WHERE order_id = $1",
        order.id.as_ref(),
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(tickets))
}

async fn swish(mut multipart: axum::extract::Multipart) -> Result<impl IntoResponse> {
    let field = multipart.next_field().await.unwrap().unwrap();
    let data = field.bytes().await.unwrap();
    let data = swish::read_latin1(&data).unwrap();

    Ok(Json(data))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(list_orders).post(create_order))
        .route("/swish", post(swish))
        .route("/:order_id", get(get_order).delete(cancel_order))
        .route("/:order_id/complete", post(complete_order))
        .route("/:order_id/tickets", get(get_tickets))
}
