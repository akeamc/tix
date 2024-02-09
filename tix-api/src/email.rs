use lettre::{
    message::{Mailbox, SinglePart},
    AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor,
};

use crate::{
    order::{Order, OrderId},
    swish::ELEVKAREN_NR,
};

pub async fn send_order_confirmation(
    mailer: &AsyncSmtpTransport<Tokio1Executor>,
    to: Mailbox,
    order: &Order,
) -> Result<(), lettre::transport::smtp::Error> {
    let from: Mailbox = "STHLM VISION <sthlmvision@sodralat.in>".parse().unwrap();
    let message = Message::builder()
        .from(from.clone())
        .to(to)
        .bcc(from)
        .subject(format!("Order {}", order.id))
        .singlepart(SinglePart::plain(indoc::formatdoc!(
            "
                Hej {name}!

                Dina biljetter har reserverats och skickas när evenemanget börjar närmar sig.

                Om du inte redan gjort det: swisha {amount} kr till {payee} och skriv ordernumret ({id}) i meddelandefältet. Ordern kan komma att avbrytas om betalning inte sker inom 24 timmar.

                Vid eventuella frågor är du välkommen att svara på detta mejl eller skicka ett meddelande till @elevkaren på Instagram.

                Vi ses!

                🤸
            ",
            name = order.name,
            id = order.id,
            amount = order.amount,
            payee = ELEVKAREN_NR,
        )))
        .unwrap();

    mailer.send(message).await?;

    Ok(())
}

pub async fn send_tickets(
    mailer: &AsyncSmtpTransport<Tokio1Executor>,
    to: Mailbox,
    order: &Order,
) -> Result<(), lettre::transport::smtp::Error> {
    #[derive(serde::Serialize)]
    struct Query<'a> {
        id: &'a OrderId,
        email: &'a str,
    }

    let query = serde_urlencoded::to_string(Query {
        id: &order.id,
        email: &order.email,
    })
    .unwrap();

    let from: Mailbox = "STHLM VISION <sthlmvision@sodralat.in>".parse().unwrap();
    let message = Message::builder()
        .from(from.clone())
        .to(to)
        .bcc(from)
        .subject(format!("Biljetter till order {}", order.id))
        .singlepart(SinglePart::plain(indoc::formatdoc!(
            "
                Hej igen {name}!

                Klicka på länken för att visa dina biljetter: https://sthlmvision.sodralat.in/tickets?{query}

                Vid eventuella frågor är du välkommen att svara på detta mejl eller skicka ett meddelande till @elevkaren på Instagram.

                Allt gott!

                🤸
            ",
            name = order.name.trim(),
        )))
        .unwrap();

    mailer.send(message).await?;

    Ok(())
}
