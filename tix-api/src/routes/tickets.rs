use axum::{
    extract::Path,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    error::{Code, ResponseError, Result},
    order::Order,
    routes::orders::Ticket,
};

use super::{auth::Identity, AppState};

const TICKETS_FOR_SALE: u32 = 266;

pub async fn tickets_remaining(executor: impl sqlx::PgExecutor<'_>) -> sqlx::Result<u32> {
    // count the number of tickets with a NULL order.canceled_at
    let count = sqlx::query!("SELECT COUNT(*) FROM tickets LEFT JOIN orders ON tickets.order_id = orders.id WHERE orders.canceled_at IS NULL")
        .fetch_one(executor)
        .await?
        .count
        .and_then(|c| c.try_into().ok())
        .unwrap_or(0);

    Ok(TICKETS_FOR_SALE.saturating_sub(count))
}

async fn list_tickets(state: AppState) -> Result<impl IntoResponse> {
    let tickets = sqlx::query_as!(Ticket, "SELECT * FROM tickets")
        .fetch_all(&state.pool)
        .await?;

    Ok(Json(tickets))
}

#[derive(Debug, serde::Serialize)]
pub struct Scan {
    pub ticket: Ticket,
    pub order: Order,
    pub already_scanned: bool,
}

async fn scan_ticket(state: AppState, Path(id): Path<Uuid>) -> Result<Json<Scan>> {
    let mut tx = state.pool.begin().await?;

    let mut ticket = sqlx::query_as!(Ticket, "SELECT * FROM tickets WHERE id = $1", id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(ResponseError::new(Code::TicketNotFound, "ticket not found"))?;

    let order = sqlx::query_as!(Order, "SELECT * FROM orders WHERE id = $1", ticket.order_id.as_ref())
        .fetch_one(&mut *tx)
        .await?;

    let already_scanned = ticket.scanned_at.is_some();

    if !already_scanned {
        ticket = sqlx::query_as!(
            Ticket,
            "UPDATE tickets SET scanned_at = NOW() WHERE id = $1 RETURNING *",
            id
        )
        .fetch_one(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok(Json(Scan {
        ticket,
        order,
        already_scanned,
    }))
}

async fn get_tickets_remaining(state: AppState) -> Result<impl IntoResponse> {
    let remaining = tickets_remaining(&state.pool).await?;

    Ok(Json(remaining))
}

#[derive(Debug, serde::Serialize)]
struct TicketStats {
    paid: u32,
}

async fn get_ticket_stats(state: AppState, _ident: Identity) -> Result<impl IntoResponse> {
    let paid: u32 = sqlx::query!("SELECT COUNT(*) FROM tickets LEFT JOIN orders ON tickets.order_id = orders.id WHERE orders.paid_at IS NOT NULL")
        .fetch_one(&state.pool)
        .await?
        .count
        .and_then(|c| c.try_into().ok())
        .unwrap_or(0);

    Ok(Json(TicketStats { paid }))
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(list_tickets))
        .route("/remaining", get(get_tickets_remaining))
        .route("/stats", get(get_ticket_stats))
        .route("/:id/scan", post(scan_ticket))
}
