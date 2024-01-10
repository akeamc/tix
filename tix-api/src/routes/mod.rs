use std::{convert::Infallible, sync::Arc};

use axum::{
    extract::{FromRef, FromRequestParts},
    http::request::Parts,
    Router,
};
use axum_extra::extract::cookie::Key;

pub mod auth;
pub mod orders;
pub mod tickets;

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub smtp: lettre::AsyncSmtpTransport<lettre::Tokio1Executor>,
    pub oidc: Arc<crate::oidc::Oidc>,
    pub cookie_key: Key,
}

impl FromRef<AppState> for Key {
    fn from_ref(state: &AppState) -> Self {
        state.cookie_key.clone()
    }
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for AppState
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = Infallible;

    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        Ok(Self::from_ref(state))
    }
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .nest("/auth", auth::routes())
        .nest("/orders", orders::routes())
        .nest("/tickets", tickets::routes())
        .layer(tower_http::cors::CorsLayer::very_permissive())
        .layer(tower_http::trace::TraceLayer::new_for_http())
}
