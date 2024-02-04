use axum::{response::IntoResponse, routing::get, Json, Router};

use crate::{error::Result, routes::orders::Ticket};

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
}
