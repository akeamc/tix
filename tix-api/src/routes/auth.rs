use axum::{
    extract::FromRef,
    http::{request::Parts, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::{
    cookie::{Cookie, Key, SameSite},
    PrivateCookieJar,
};
use openidconnect::{core::CoreIdToken, Nonce};
use serde::{Deserialize, Serialize};

use crate::error::{Code, ResponseError, Result};

use super::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Identity {
    pub email: String,
}

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for Identity
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ResponseError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let jar = PrivateCookieJar::<Key>::from_request_parts(parts, &AppState::from_ref(state))
            .await
            .unwrap();

        let cookie = jar.get("email").ok_or(ResponseError::new(
            Code::MissingCookie,
            "missing auth cookie",
        ))?;

        Ok(Identity {
            email: cookie.value().into(),
        })
    }
}

async fn get_identity(identity: Identity) -> impl IntoResponse {
    Json(identity)
}

#[derive(Debug, Deserialize)]
struct LoginRequest {
    id_token: CoreIdToken,
    nonce: Nonce,
}

async fn login(
    state: AppState,
    jar: PrivateCookieJar,
    Json(req): Json<LoginRequest>,
) -> Result<impl IntoResponse> {
    let LoginRequest { id_token, nonce } = req;

    let client = state.oidc.discover_client().await?;

    let claims = id_token
        .into_claims(&client.id_token_verifier(), &nonce)
        .map_err(|e| ResponseError::new(Code::InvalidIdToken, e.to_string()))?;

    let email = claims.email().unwrap().to_string();
    let cookie = Cookie::build(("email", email.clone()))
        .http_only(true)
        .path("/")
        .permanent()
        .same_site(SameSite::None)
        .build();
    let identity = Identity { email };

    Ok((jar.add(cookie), Json(identity)))
}

async fn logout(jar: PrivateCookieJar) -> impl IntoResponse {
    let mut cookie = Cookie::build(("email", ""))
        .http_only(true)
        .path("/")
        .same_site(SameSite::None)
        .build();
    cookie.make_removal();
    (jar.add(cookie), StatusCode::NO_CONTENT)
}

pub fn routes() -> Router<AppState> {
    Router::<AppState>::new()
        .route("/", get(get_identity))
        .route("/login", post(login))
        .route("/logout", post(logout))
}
