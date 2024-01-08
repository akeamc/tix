use lettre::{message::Mailbox, AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

use crate::{order::Order, ELEVKAREN_SWISH};

pub async fn send_order_confirmation(
    mailer: &AsyncSmtpTransport<Tokio1Executor>,
    to: Mailbox,
    order: &Order,
) -> Result<(), lettre::transport::smtp::Error> {
    let message = Message::builder()
        .from("STHLM VISION <sthlmvision@sodralat.in>".parse().unwrap())
        .to(to)
        .subject("Orderbekräftelse från STHLM VISION")
        .body(indoc::formatdoc!(
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
            payee = ELEVKAREN_SWISH,
        ))
        .unwrap();

    mailer.send(message).await?;

    Ok(())
}
