use dioxus::prelude::*;
use futures::StreamExt;
use gloo::{timers::future::TimeoutFuture, utils::window};
use qr_scanner::QrScanner;

#[derive(Props)]
struct TicketInfoProps<'a> {
    value: &'a str,
    ondismiss: EventHandler<'a, ()>,
}

fn TicketInfo<'a>(cx: Scope<'a, TicketInfoProps<'a>>) -> Element<'a> {
    let is_valid = use_future(cx, (), |_| async move {
        TimeoutFuture::new(2000).await;
        false
    });

    cx.render(rsx! {
        div {
            class: "absolute inset-0 z-10 overflow-y-auto pt-40",
            div {
                class: "absolute inset-0 bg-black bg-opacity-50 animate-in fade-in duration-300",
                onclick: |_| cx.props.ondismiss.call(()),
            }
            div {
                onclick: |_| cx.props.ondismiss.call(()),
                class: "animate-in slide-in-from-bottom-[100vh] duration-300 bg-white min-h-full rounded-t-3xl p-4 z-10 relative",
                "Ticket: "
                strong {
                    cx.props.value.repeat(100)
                }
                match is_valid.state() {
                    UseFutureState::Complete(&is_valid) => {
                        if is_valid {
                            rsx!(div {
                                class: "absolute inset-0 bg-green-500 bg-opacity-50 rounded-t-3xl",
                                "Valid"
                            })
                        } else {
                            rsx!(div {
                                class: "absolute inset-0 bg-red-500 bg-opacity-50 rounded-t-3xl",
                                "Invalid"
                            })
                        }
                    }
                    _ => rsx!({
                        "..."
                    })
                }
            }
        }
    })
}

pub fn Scanner(cx: Scope) -> Element {
    let ticket = use_state(cx, || None);
    let scans = use_coroutine(cx, |mut rx| {
        to_owned![ticket];
        async move {
            while let Some(data) = rx.next().await {
                if ticket.current().is_none() {
                    window().navigator().vibrate_with_duration(200);
                    ticket.set(Some(data));
                }
            }
        }
    });

    cx.render(rsx! {
        div {
            class: "fixed inset-0",
            QrScanner {
                scans: &scans,
            }
            if let Some(v) = ticket.get() {
                rsx!(TicketInfo {
                    ondismiss: |_| ticket.set(None),
                    value: v,
                })
            }
        }
    })
}
