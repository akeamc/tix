pub const ELEVKAREN_NR: &str = "123-345 69 51";

use serde::{Deserialize, Serialize};
use time::{Date, Time};

time::serde::format_description!(yyyy_mm_dd, Date, "[year]-[month]-[day]");
time::serde::format_description!(hh_mm, Time, "[hour]:[minute]");

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct Transaction {
    radnr: usize,
    clnr: String,
    kontonr: String,
    #[serde(with = "yyyy_mm_dd")]
    bokfdag: Date,
    #[serde(with = "yyyy_mm_dd")]
    transdag: Date,
    #[serde(with = "yyyy_mm_dd::option")]
    valutadag: Option<Date>,
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

#[derive(Debug, thiserror::Error)]
pub enum ReadError {
    #[error("failed to decode Windows-1252")]
    CharsetError,
    #[error("csv error: {0}")]
    Csv(#[from] csv::Error),
}

#[derive(Debug, Serialize)]
pub struct SwishReport {
    notes: Option<String>,
    transactions: Vec<Transaction>,
}

pub fn read_latin1(bytes: &[u8]) -> Result<SwishReport, ReadError> {
    let (s, _, _flawless) = encoding_rs::WINDOWS_1252.decode(bytes);

    read(&s)
}

pub fn read(inp: &str) -> Result<SwishReport, ReadError> {
    // remove first line if it starts with *
    // * Swish-rapport Avser 2024-01-01 - 2024-01-10 Skapad 2024-01-10 12:23 CET
    let (notes, csv) = if inp.starts_with('*') {
        let (notes, csv) = inp.split_once('\n').unwrap();
        (Some(notes), csv)
    } else {
        (None, inp)
    };

    let transactions = ::csv::Reader::from_reader(csv.as_bytes())
        .into_deserialize::<Transaction>()
        .collect::<Result<_, _>>()?;

    Ok(SwishReport {
        notes: notes.map(ToOwned::to_owned),
        transactions,
    })
}
