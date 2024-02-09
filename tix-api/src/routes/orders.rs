use std::collections::HashMap;
use std::{convert::TryInto, num::NonZeroUsize};

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use lettre::message::Mailbox;
use rust_decimal::prelude::ToPrimitive;
use serde::{Deserialize, Serialize};
use sqlx::PgExecutor;
use sqlx::{postgres::PgQueryResult, types::Uuid};
use time::OffsetDateTime;

use crate::email::{send_order_confirmation, send_tickets};
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
    #[serde(with = "time::serde::rfc3339::option")]
    pub scanned_at: Option<OffsetDateTime>,
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

#[derive(Debug, Serialize)]
struct DetailedOrder {
    #[serde(flatten)]
    order: Order,
    tickets: Vec<Ticket>,
}

async fn list_orders(state: AppState, _identity: Identity) -> Result<Json<Vec<DetailedOrder>>> {
    let records = sqlx::query!(
        "SELECT
    o.id as order_id,
    o.email as email,
    o.name as name,
    o.phone as phone,
    o.amount as amount,
    o.created_at as created_at,
    o.paid_at as paid_at,
    o.completed_at as completed_at,
    o.canceled_at as canceled_at,
    o.emailed_at as emailed_at,
    t.id as ticket_id,
    t.scanned_at as scanned_at
  FROM
    orders o
    JOIN tickets t ON o.id = t.order_id
    "
    )
    .fetch_all(&state.pool)
    .await?;

    let mut orders = HashMap::new();

    for record in records {
        let order_id: OrderId = record.order_id.into();
        let ticket_id = record.ticket_id;

        let order = orders
            .entry(order_id.clone())
            .or_insert_with(|| DetailedOrder {
                order: Order {
                    id: order_id.clone(),
                    email: record.email,
                    name: record.name,
                    phone: record.phone,
                    amount: record.amount,
                    created_at: record.created_at,
                    paid_at: record.paid_at,
                    completed_at: record.completed_at,
                    canceled_at: record.canceled_at,
                    emailed_at: record.emailed_at,
                },
                tickets: Vec::new(),
            });

        order.tickets.push(Ticket {
            id: ticket_id,
            order_id,
            scanned_at: record.scanned_at,
        });
    }

    let mut orders = orders.into_values().collect::<Vec<_>>();
    orders.sort_by_key(|order| std::cmp::Reverse(order.order.created_at));
    for order in &mut orders {
        order.tickets.sort_by_key(|ticket| ticket.id);
    }
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

async fn swish(
    state: AppState,
    mut multipart: axum::extract::Multipart,
) -> Result<impl IntoResponse> {
    let field = multipart.next_field().await.unwrap().unwrap();
    let data = field.bytes().await.unwrap();
    let data = swish::parse_transactions(&data).unwrap();

    let mut tx = state.pool.begin().await?;

    // build an sql query that sets the paid_at field to the time of the transaction
    // for each transaction in the data
    // let mut query_builder = sqlx::QueryBuilder::new("UPDATE orders SET paid_at = $1 WHERE id = $2");
    // query_builder.push_values(
    //     data.iter(),
    //     |mut b, transaction| {
    //         b.push_bind(transaction.time).push_bind(transaction.message);
    //     },
    // );

    for transaction in data.iter() {
        let Some(amount) = transaction.amount.to_i32() else {
            continue;
        };
        sqlx::query!(
            "UPDATE orders SET paid_at = $1 WHERE id = $2 AND amount = $3",
            transaction.time,
            transaction.message,
            amount,
        )
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(StatusCode::ACCEPTED)
}

async fn order_to_email(executor: impl PgExecutor<'_>) -> Result<Option<Order>> {
    Ok(sqlx::query_as!(
        Order,
        "SELECT * FROM orders WHERE emailed_at IS NULL AND paid_at IS NOT NULL ORDER BY random() LIMIT 1"
    )
    .fetch_optional(executor)
    .await?)
}

async fn email_tickets(state: AppState, _identity: Identity) -> Result<impl IntoResponse> {
    let mut tx = state.pool.begin().await?;
    let mut count = 0;

    while let Some(order) = order_to_email(&mut *tx).await? {
        let mbox = Mailbox::new(Some(order.name.clone()), order.email.parse().unwrap());
        if let Err(err) = send_tickets(&state.smtp, mbox, &order).await {
            tracing::error!("failed to send tickets to {}: {}", order.email, err);
            break;
        }
        sqlx::query!(
            "UPDATE orders SET emailed_at = NOW() WHERE id = $1",
            order.id.as_ref()
        )
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        count += 1;
        tx = state.pool.begin().await?;
    }

    tx.commit().await?;

    Ok(Json(count))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(list_orders).post(create_order))
        .route("/swish", post(swish))
        .route("/email", post(email_tickets))
        .route("/:order_id", get(get_order).delete(cancel_order))
        .route("/:order_id/complete", post(complete_order))
        .route("/:order_id/tickets", get(get_tickets))
}
