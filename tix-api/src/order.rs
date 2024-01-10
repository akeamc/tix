use std::{fmt, iter};

use rand::Rng;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

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
