use barcoders::{
    generators::svg::SVG,
    sym::{code39::Code39, ean13::EAN13},
};
use dioxus::prelude::*;
use getrandom::getrandom;

#[derive(PartialEq, Props)]
struct BarcodeProps<T>
where
    T: Dep + AsRef<str>,
{
    data: T,
    width: u32,
    height: u32,
}

fn Barcode<T: Dep + AsRef<str>>(cx: Scope<BarcodeProps<T>>) -> Element {
    let barcode = use_memo(cx, (&cx.props.data,), |(data,)| {
        Code39::new(data).unwrap().encode()
    });
    let BarcodeProps { width, height, .. } = cx.props;
    let rect_height = (height * barcode.len() as u32) / width;

    cx.render(rsx!(svg {
        class: "w-full",
        view_box: "0 0 {barcode.len()} {rect_height}",
        barcode.iter().enumerate().filter(|&(_, &n)| n == 1).map(|(i, _)| rsx!{
            rect {
                x: "{i}",
                y: "0",
                width: "1",
                height: "{rect_height}",
                fill: "black",
            }
        })
    }))
}

#[derive(PartialEq, Props)]
struct QrProps<'a> {
    data: &'a [u8],
}

fn Qr<'a>(cx: Scope<'a, QrProps<'a>>) -> Element<'a> {
    use qrcode::{render::svg::Color, EcLevel, QrCode};

    let svg = QrCode::with_error_correction_level(cx.props.data, EcLevel::L)
        .unwrap()
        .render::<Color>()
        .quiet_zone(false)
        .light_color(Color("transparent"))
        .build();

    cx.render(rsx!(div {
        class: "[&>*]:w-full [&>*]:h-full",
        dangerous_inner_html: "{svg}",
    }))
}

#[derive(Props)]
pub struct TicketProps<'a> {
    pub value: &'a str,
}

pub fn Ticket<'a>(cx: Scope<'a, TicketProps<'a>>) -> Element<'a> {
    let value = cx.props.value;

    cx.render(rsx!(div {
        class: "bg-white flex flex-col w-40 overflow-hidden",
        img {
            src: "http://placekitten.com/300/300",
            class: "object-cover aspect-square overflow-hidden"
        }
        div {
          div {
            class: "p-4"
          }
          hr {
            class: "border-gray-200 border-t-[1px] border-dashed"
          }
          button {
              class: "p-4 flex-shrink-0 flex flex-col hover:bg-gray-200 transition-colors overflow-hidden",
              // Barcode {
              //   data: val.get().clone(),
              //   height: 20,
              //   width: 100,
              // }
              Qr {
                data: value.as_bytes(),
              }
              span {
                class: "font-mono text-xs leading-none mt-2",
                "{value}"
              }
            }
        }
    }))
}
