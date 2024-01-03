#![allow(non_snake_case)]
use dioxus::prelude::*;

mod components;

use components::*;
use gloo::timers::future::TimeoutFuture;

fn main() {
    dioxus_logger::init(log::LevelFilter::Info).expect("failed to init logger");

    // launch the web app
    dioxus_web::launch(App);
}

fn get_value() -> String {
    let mut val = [0u8; 100];
    _ = getrandom::getrandom(&mut val);

    let mut out = String::new();
    for (i, &byte) in val.iter().enumerate() {
        out.push_str(&format!("{:02X}", byte));
        if i % 2 == 1 && i != val.len() - 1 {
            out.push(' ');
        }
    }
    out
}

// create a component that renders a div with the text "Hello, world!"
fn App(cx: Scope) -> Element {
    let scanning = use_state(cx, || false);
    let value = use_state(cx, || get_value());

    use_future(cx, (value,), |(value,)| async move {
        loop {
            TimeoutFuture::new(1000).await;
            value.set(get_value());
        }
    });

    cx.render(rsx! {
        if **scanning {
            rsx!(scanner::Scanner {})
        } else {
            rsx!(ticket::Ticket {
                value: &value,
            })
        }
        button {
            onclick: move |_| {
                scanning.set(!scanning.get());
            },
            "Scan"
        }
    })
}
