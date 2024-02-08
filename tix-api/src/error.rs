use axum::{http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use tracing::error;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Code {
    InternalError,
    OrderNotFound,
    TooManyTickets,
    OrderCompleted,
    InvalidIdToken,
    MissingCookie,
    TicketNotFound,
}

impl Code {
    const fn status(&self) -> StatusCode {
        match self {
            Self::InternalError => StatusCode::INTERNAL_SERVER_ERROR,
            Self::OrderNotFound | Self::TicketNotFound => StatusCode::NOT_FOUND,
            Self::TooManyTickets | Self::OrderCompleted | Self::InvalidIdToken => {
                StatusCode::BAD_REQUEST
            }
            Self::MissingCookie => StatusCode::UNAUTHORIZED,
        }
    }
}

pub struct ResponseError {
    pub code: Code,
    pub message: String,
}

impl ResponseError {
    pub fn new(code: Code, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

impl IntoResponse for ResponseError {
    fn into_response(self) -> axum::response::Response {
        (self.code.status(), self.message).into_response()
    }
}

impl From<lettre::transport::smtp::Error> for ResponseError {
    fn from(e: lettre::transport::smtp::Error) -> Self {
        error!(?e);
        Self::new(Code::InternalError, "smtp error")
    }
}

impl From<sqlx::Error> for ResponseError {
    fn from(e: sqlx::Error) -> Self {
        error!(?e);
        Self::new(Code::InternalError, format!("database error: {e}"))
    }
}

pub type Result<T, E = ResponseError> = std::result::Result<T, E>;
