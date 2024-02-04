use serde::Serialize;
use time::OffsetDateTime;

pub const ELEVKAREN_NR: &str = "123-345 69 51";

pub mod csv {
    use serde::Deserialize;
    use time::{Date, Time};
    use time_tz::PrimitiveDateTimeExt;

    time::serde::format_description!(yyyy_mm_dd, Date, "[year]-[month]-[day]");
    time::serde::format_description!(hh_mm, Time, "[hour]:[minute]");

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "PascalCase")]
    pub struct Row {
        // radnr: usize,
        // clnr: String,
        // kontonr: String,
        // #[serde(with = "yyyy_mm_dd")]
        // bokfdag: Date,
        #[serde(with = "yyyy_mm_dd")]
        transdag: Date,
        // #[serde(with = "yyyy_mm_dd::option")]
        // valutadag: Option<Date>,
        mottagarnr: String,
        mottagarnamn: String,
        #[serde(rename = "Avsändarnr")]
        avsandarnr: String,
        #[serde(rename = "Avsändarnamn")]
        avsandarnamn: String,
        meddelande: String,
        #[serde(with = "hh_mm")]
        tid: Time,
        #[serde(with = "rust_decimal::serde::str")]
        belopp: rust_decimal::Decimal,
    }

    impl From<Row> for super::Transaction {
        fn from(row: Row) -> Self {
            let time = row
                .transdag
                .with_time(row.tid)
                .assume_timezone_utc(time_tz::timezones::db::europe::STOCKHOLM);

            Self {
                time,
                amount: row.belopp,
                message: row.meddelande,
                payor: super::Part {
                    phone: row.avsandarnr,
                    name: row.avsandarnamn,
                },
                payee: super::Part {
                    phone: row.mottagarnr,
                    name: row.mottagarnamn,
                },
            }
        }
    }

    pub fn read(input: &str) -> impl Iterator<Item = ::csv::Result<Row>> + '_ {
        // remove first line if it starts with *
        // * Swish-rapport Avser 2024-01-01 - 2024-01-10 Skapad 2024-01-10 12:23 CET
        let csv = input
            .starts_with('*')
            .then(|| input.split_once('\n').map(|(_, after)| after))
            .flatten()
            .unwrap_or(input);

        ::csv::Reader::from_reader(csv.as_bytes()).into_deserialize::<Row>()
    }

    pub fn read_latin1(bytes: &[u8]) -> ::csv::Result<Vec<Row>> {
        let (s, _, _flawless) = encoding_rs::WINDOWS_1252.decode(bytes);

        read(&s).collect()
    }
}

#[derive(Debug, Serialize)]
pub struct Part {
    pub phone: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct Transaction {
    #[serde(with = "time::serde::rfc3339")]
    pub time: OffsetDateTime,
    pub amount: rust_decimal::Decimal,
    pub message: String,
    /// The one who sent the money.
    pub payor: Part,
    /// The one who received the money.
    pub payee: Part,
}

pub fn parse_transactions(input: &[u8]) -> ::csv::Result<Vec<Transaction>> {
    let (s, _, _) = encoding_rs::WINDOWS_1252.decode(input);

    csv::read(&s).map(|r| r.map(Into::into)).collect()
}
