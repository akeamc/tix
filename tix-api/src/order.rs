use std::{fmt, iter};

use axum::{
    extract::{FromRef, Path, Query},
    http::request::Parts,
};
use rand::Rng;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::{
    error::{Code, ResponseError},
    routes::{auth::Identity, AppState},
};

fn unambiguous_str(len: usize) -> String {
    const CHARSET: &[u8] = b"CDEFHJKMNPRTVWXY2345689";
    let mut rng = rand::thread_rng();
    iter::repeat_with(|| CHARSET[rng.gen_range(0..CHARSET.len())] as char)
        .take(len)
        .collect()
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type)]
#[sqlx(transparent)]
pub struct OrderId(String);

impl fmt::Display for OrderId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.0.fmt(f)
    }
}

impl AsRef<str> for OrderId {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

#[allow(clippy::new_without_default)]
impl OrderId {
    pub fn new() -> Self {
        Self(unambiguous_str(8))
    }
}

impl From<String> for OrderId {
    fn from(s: String) -> Self {
        Self(s)
    }
}

#[derive(Debug, Serialize)]
pub struct Order {
    pub id: OrderId,
    pub email: String,
    pub name: String,
    pub phone: String,
    pub amount: i32,
    #[serde(with = "time::serde::rfc3339")]
    pub created_at: OffsetDateTime,
    #[serde(with = "time::serde::rfc3339::option")]
    pub completed_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub paid_at: Option<OffsetDateTime>,
    #[serde(with = "time::serde::rfc3339::option")]
    pub canceled_at: Option<OffsetDateTime>,
}

#[derive(Debug, thiserror::Error)]
enum ExtractOrderError {
    #[error("order not found")]
    OrderNotFound,
}

impl From<ExtractOrderError> for ResponseError {
    fn from(value: ExtractOrderError) -> Self {
        match value {
            ExtractOrderError::OrderNotFound => Self::new(Code::OrderNotFound, "order not found"),
        }
    }
}

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for Order
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ResponseError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        #[derive(Debug, Deserialize)]
        struct PathParams {
            order_id: OrderId,
        }

        #[derive(Debug, Deserialize)]
        struct QueryParams {
            email: String,
        }

        let Path(PathParams { order_id }) = Path::from_request_parts(parts, &state).await.unwrap();

        let provided_email = if Identity::from_request_parts(parts, state).await.is_err() {
            // unauthenticated
            let Query(QueryParams { email }) =
                Query::from_request_parts(parts, &state).await.unwrap();
            Some(email)
        } else {
            // admin authenticated, no need to check query params
            None
        };

        let pool = AppState::from_ref(state).pool;
        let order = sqlx::query_as!(
            Order,
            "SELECT * FROM orders WHERE id = $1",
            order_id.as_ref(),
        )
        .fetch_optional(&pool)
        .await?
        .ok_or(ExtractOrderError::OrderNotFound)?;

        match provided_email {
            Some(provided_email) if provided_email == order.email => Ok(order),
            None => Ok(order),
            Some(_) => Err(ExtractOrderError::OrderNotFound.into()),
        }
    }
}
