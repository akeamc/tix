use std::sync::Arc;

use axum_extra::extract::cookie::Key;
use base64::{engine::general_purpose::STANDARD, Engine};
use clap::Parser;
use lettre::{
    transport::smtp::{authentication::Credentials, extension::ClientId},
    AsyncSmtpTransport, Tokio1Executor,
};

use sqlx::PgPool;
use tix_api::{oidc::Oidc, routes::AppState};

#[derive(Debug, Parser)]
struct Options {
    #[clap(long, env, hide_env_values = true)]
    database_url: String,
    #[clap(long, env)]
    gmail_username: String,
    #[clap(long, env, hide_env_values = true)]
    gmail_password: String,
    #[clap(long, env)]
    next_public_google_client_id: String,
    #[clap(long, env, hide_env_values = true)]
    google_client_secret: String,
    #[clap(long, env, hide_env_values = true)]
    cookie_key: String,
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
        .hello_name(ClientId::Domain("sthlmvision.fly.dev".into()))
        .build();
    let oidc = Arc::new(Oidc {
        client_id: openidconnect::ClientId::new(options.next_public_google_client_id),
        client_secret: openidconnect::ClientSecret::new(options.google_client_secret),
    });
    let cookie_key = Key::try_from(&STANDARD.decode(options.cookie_key)?[..])?;

    let pool = PgPool::connect(&options.database_url).await?;
    sqlx::migrate!().run(&pool).await?;

    let app = tix_api::routes::routes().with_state(AppState {
        pool,
        smtp,
        oidc,
        cookie_key,
    });

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await?;
    axum::serve(listener, app).await?;

    Ok(())
}
