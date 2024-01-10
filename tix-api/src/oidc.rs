use std::ops::Deref;

use openidconnect::{
    core::{CoreClient, CoreProviderMetadata},
    ClientId, ClientSecret, IssuerUrl, LocalizedClaim,
};

use crate::error::{Code, ResponseError};

mod http_client {
    use http_cache_reqwest::{Cache, CacheMode, HttpCache, HttpCacheOptions, MokaManager};
    use once_cell::sync::Lazy;
    use openidconnect::{HttpRequest, HttpResponse};
    use reqwest_middleware::ClientWithMiddleware;

    pub type RequestError = reqwest_middleware::Error;

    static CLIENT: Lazy<ClientWithMiddleware> = Lazy::new(|| {
        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .unwrap();

        reqwest_middleware::ClientBuilder::new(client)
            .with(Cache(HttpCache {
                mode: CacheMode::Default,
                manager: MokaManager::default(),
                options: HttpCacheOptions::default(),
            }))
            .build()
    });

    pub async fn call(req: HttpRequest) -> Result<HttpResponse, RequestError> {
        let HttpRequest {
            url,
            method,
            headers,
            body,
        } = req;

        let res = CLIENT
            .request(method, url)
            .body(body)
            .headers(headers)
            .send()
            .await?;

        Ok(openidconnect::HttpResponse {
            status_code: res.status(),
            headers: res.headers().to_owned(),
            body: res.bytes().await?.to_vec(),
        })
    }
}

#[derive(Debug, thiserror::Error)]
#[error("oidc discovery error: {0}")]
pub struct DiscoveryError(#[from] openidconnect::DiscoveryError<http_client::RequestError>);

impl From<DiscoveryError> for ResponseError {
    fn from(err: DiscoveryError) -> Self {
        Self::new(Code::InternalError, err.to_string())
    }
}

#[derive(Debug, Clone)]
pub struct Oidc {
    pub client_id: ClientId,
    pub client_secret: ClientSecret,
}

impl Oidc {
    pub async fn discover_client(&self) -> Result<CoreClient, DiscoveryError> {
        let metadata = CoreProviderMetadata::discover_async(
            IssuerUrl::new("https://accounts.google.com".into()).unwrap(),
            http_client::call,
        )
        .await?;

        Ok(CoreClient::from_provider_metadata(
            metadata,
            self.client_id.clone(),
            Some(self.client_secret.clone()),
        ))
    }
}

// macro_rules! parser_impl {
//     ($($name:ident;)*) => {
//         paste::paste! {
//             #[derive(Debug, Clone, clap::Parser)]
//             struct Parser {
//                 $(
//                     #[clap(long, env)]
//                     [<$name:snake _client_id>]: String,
//                     #[clap(long, env)]
//                     [<$name:snake _client_secret>]: String,
//                 )*
//             }
//         }

//         impl clap::FromArgMatches for Oidc {
//             fn from_arg_matches(matches: &clap::ArgMatches) -> Result<Self, clap::Error> {
//                 Parser::from_arg_matches(matches).map(Into::into)
//             }

//             fn update_from_arg_matches(&mut self, matches: &clap::ArgMatches) -> Result<(), clap::Error> {
//                 *self = Self::from_arg_matches(matches)?;
//                 Ok(())
//             }
//         }

//         impl clap::Args for Oidc {
//             fn augment_args(command: clap::Command) -> clap::Command {
//                 Parser::augment_args(command)
//             }

//             fn augment_args_for_update(command: clap::Command) -> clap::Command {
//                 Parser::augment_args_for_update(command)
//             }
//         }

//         impl From<Parser> for Oidc {
//             fn from(args: Parser) -> Self {
//                 paste::paste! {
//                     Self {
//                         $([<$name:snake>]: (
//                             ClientId::new(args.[<$name:snake _client_id>]),
//                             ClientSecret::new(args.[<$name:snake _client_secret>]),
//                         ),)*
//                     }
//                 }
//             }
//         }
//     }
// }

// macro_rules! provider_impl {
//     ($($name:ident, $url:expr;)*) => {
//         #[derive(Debug, Serialize, Deserialize, Clone, Copy)]
//         #[serde(rename_all = "lowercase")]
//         pub enum Provider {
//             $($name,)*
//         }

//         impl Provider {
//             fn issuer_url(&self) -> IssuerUrl {
//                 let url = match self {
//                     $(Provider::$name => $url,)*
//                 }.to_owned();

//                 IssuerUrl::new(url).unwrap()
//             }
//         }

//         paste::paste! {
//             #[derive(Debug, Clone)]
//             pub struct Oidc {
//                 $([<$name:snake>]: (ClientId, ClientSecret),)*
//             }

//             impl Oidc {
//                 fn get(&self, provider: Provider) -> &(ClientId, ClientSecret) {
//                     match provider {
//                         $(Provider::$name => &self.[<$name:snake>],)*
//                     }
//                 }
//             }
//         }

//         #[cfg(feature = "clap")]
//         parser_impl! {
//             $($name;)*
//         }
//     };
// }

// provider_impl! {
//     Google, "https://accounts.google.com";
// }

// #[derive(Debug, thiserror::Error)]
// pub enum AuthError {
//     #[error("email not verified")]
//     UnverifiedEmail,
//     #[error("email missing in id token")]
//     MissingEmail,
//     #[error(transparent)]
//     Database(#[from] sqlx::Error),
// }

// impl From<AuthError> for ResponseError {
//     fn from(err: AuthError) -> Self {
//         let code = match err {
//             AuthError::UnverifiedEmail => Code::UnverifiedEmail,
//             AuthError::MissingEmail => Code::InvalidIdToken,
//             AuthError::Database(e) => return e.into(),
//             AuthError::CreateUser(e) => return e.into(),
//         };

//         Self::new(code, err.to_string())
//     }
// }

// #[instrument(skip_all, fields(issuer = claims.issuer().as_str(), subject = claims.subject().as_str()))]
// pub async fn register_or_login(
//     claims: CoreIdTokenClaims,
//     tx: &mut Transaction<'_, Postgres>,
// ) -> Result<User, AuthError> {
//     if claims.email_verified() != Some(true) {
//         return Err(AuthError::UnverifiedEmail);
//     }

//     let email = claims.email().ok_or(AuthError::MissingEmail)?.as_str();

//     let user = if let Some(user) = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
//         .bind(email)
//         .fetch_optional(tx.as_mut())
//         .await?
//     {
//         sqlx::query!(
//             "UPDATE users SET name = $1, picture = $2 WHERE id = $3",
//             claims.name().default_locale(),
//             claims.picture().default_locale(),
//             user.id
//         )
//         .execute(tx.as_mut())
//         .await?;

//         user
//     } else {
//         user::create(
//             CreateUser {
//                 email: email.to_owned(),
//                 name: claims.name().default_locale(),
//                 picture: claims.picture().default_locale(),
//             },
//             tx,
//         )
//         .await?
//     };

//     Ok(user)
// }
trait LocalizedClaimExt {
    fn default_locale(&self) -> Option<String>;
}

impl<T> LocalizedClaimExt for LocalizedClaim<T>
where
    T: Deref<Target = String>,
{
    fn default_locale(&self) -> Option<String> {
        let t = self.get(None)?;
        Some(t.deref().to_owned())
    }
}

impl<T> LocalizedClaimExt for Option<&LocalizedClaim<T>>
where
    T: Deref<Target = String>,
{
    fn default_locale(&self) -> Option<String> {
        self.and_then(LocalizedClaimExt::default_locale)
    }
}
