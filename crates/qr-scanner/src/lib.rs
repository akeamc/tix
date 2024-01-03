#![allow(non_snake_case)]
#![warn(clippy::pedantic)]

use dioxus::prelude::*;

use futures::StreamExt;
use gloo_timers::future::TimeoutFuture;
use image::DynamicImage;
use js_sys::{Reflect, Uint8Array};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    wasm_bindgen::JsCast, Blob, HtmlVideoElement, ImageEncodeOptions, MediaStream,
    MediaStreamConstraints, MediaStreamTrack, MediaTrackConstraints, OffscreenCanvas,
    OffscreenCanvasRenderingContext2d, VideoFacingModeEnum, Window,
};

#[inline]
fn window() -> Window {
    web_sys::window().expect("not a browser")
}

trait CanvasExt {
    fn context_2d(&self) -> OffscreenCanvasRenderingContext2d;

    async fn to_image(&self) -> DynamicImage;
}

impl CanvasExt for OffscreenCanvas {
    fn context_2d(&self) -> OffscreenCanvasRenderingContext2d {
        self.get_context("2d")
            .expect("context should be available")
            .unwrap()
            .dyn_into::<OffscreenCanvasRenderingContext2d>()
            .unwrap()
    }

    async fn to_image(&self) -> DynamicImage {
        let start = gloo_console::Timer::new("to_image");
        let blob = JsFuture::from(
            self.convert_to_blob_with_options(ImageEncodeOptions::new().type_("image/png"))
                .unwrap(),
        )
        .await
        .unwrap()
        .dyn_into::<Blob>()
        .unwrap();
        // if this future is cancelled, the callback will be dropped
        // and js won't be able to call it
        // std::mem::forget(cb);

        // let blob = rx.await.unwrap();
        let array_buffer = JsFuture::from(blob.array_buffer()).await.unwrap();
        let buffer = Uint8Array::new(&array_buffer).to_vec();

        drop(start);

        image::load_from_memory(&buffer).unwrap()
    }
}

async fn get_media_stream() -> Option<MediaStream> {
    match JsFuture::from(
        window()
            .navigator()
            .media_devices()
            .unwrap()
            .get_user_media_with_constraints(MediaStreamConstraints::new().video(
                MediaTrackConstraints::new().facing_mode(&VideoFacingModeEnum::Environment.into()),
            ))
            .unwrap(),
    )
    .await
    {
        Ok(v) => Some(v.dyn_into().expect("not a MediaStream")),
        Err(e) => {
            tracing::error!("failed to get media stream: {e:?}");
            None
        }
    }
}

fn first_video_track(stream: &MediaStream) -> Option<MediaStreamTrack> {
    match stream.get_video_tracks().get(0) {
        v if v.is_undefined() => None,
        v => Some(v.dyn_into().expect("not a MediaStreamTrack")),
    }
}

fn track_dimensions(track: &MediaStreamTrack) -> (f64, f64) {
    let settings = track.get_settings();

    let width = Reflect::get(&settings, &"width".into())
        .unwrap()
        .as_f64()
        .unwrap();
    let height = Reflect::get(&settings, &"height".into())
        .unwrap()
        .as_f64()
        .unwrap();

    (width, height)
}

type ScanSender = Coroutine<String>;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
enum ScannerStatus {
    Active,
    NoCamera,
    #[default]
    Wait,
}

#[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
async fn scan_coroutine(
    mut rx: UnboundedReceiver<HtmlVideoElement>,
    scans: ScanSender,
    status: UseState<ScannerStatus>,
) {
    let mut stream = get_media_stream().await;
    // let canvas = Canvas::new();
    let canvas = OffscreenCanvas::new(0, 0).unwrap();

    let video = rx.next().await.unwrap();
    video.set_src_object(stream.as_ref());

    let ctx = canvas.context_2d();

    loop {
        let stream = loop {
            match stream {
                Some(ref stream) if stream.active() => {
                    status.set(ScannerStatus::Active);
                    break stream;
                }
                _ => {
                    tracing::warn!("stream is inactive");
                    status.set(ScannerStatus::NoCamera);
                    TimeoutFuture::new(1000).await;
                    stream = get_media_stream().await;
                    video.set_src_object(stream.as_ref());
                }
            }
        };

        let (width, height) = track_dimensions(&first_video_track(stream).unwrap());
        canvas.set_width(width as _);
        canvas.set_height(height as _);

        ctx.draw_image_with_html_video_element_and_dw_and_dh(
            &video,
            0.,
            0.,
            width as _,
            height as _,
        )
        .unwrap();
        let img = canvas.to_image().await.to_luma8();
        let mut img = rqrr::PreparedImage::prepare(img);
        let grids = img.detect_grids();

        tracing::info!("detected {} grids", grids.len());

        for grid in &grids {
            // decode the grid
            match grid.decode() {
                Ok((_meta, s)) => {
                    // let [a, b, c, d] = grid.bounds;
                    // ui_ctx.begin_path();
                    // ui_ctx.move_to(a.x as _, a.y as _);
                    // ui_ctx.line_to(b.x as _, b.y as _);
                    // ui_ctx.line_to(c.x as _, c.y as _);
                    // ui_ctx.line_to(d.x as _, d.y as _);
                    // ui_ctx.line_to(a.x as _, a.y as _);
                    // ui_ctx.fill();

                    scans.send(s);
                }
                Err(e) => tracing::error!("decode err: {e:?}"),
            }
        }

        TimeoutFuture::new(100).await;
    }
}

#[derive(Props)]
pub struct ScannerProps<'a> {
    pub scans: &'a ScanSender,
}

/// A QR code scanner.
#[must_use]
pub fn QrScanner<'a>(cx: Scope<'a, ScannerProps<'a>>) -> Element<'a> {
    let status = use_state(cx, ScannerStatus::default);
    let x = use_coroutine(cx, |rx| {
        to_owned![status];
        scan_coroutine(rx, cx.props.scans.clone(), status)
    });

    let onmounted = |event: Event<MountedData>| {
        let element = event
            .get_raw_element()
            .unwrap()
            .downcast_ref::<web_sys::Element>()
            .unwrap()
            .dyn_ref::<HtmlVideoElement>()
            .unwrap()
            .to_owned();

        x.send(element);
    };

    cx.render(rsx! {
        div {
            class: "relative bg-black w-full h-screen",
            video {
                class: "absolute inset-0 object-cover w-full h-full",
                onmounted: onmounted,
                autoplay: true,
            }
            div {
                class: "absolute inset-0 flex items-center justify-center text-white",
                match status.get() {
                    ScannerStatus::NoCamera => "No camera",
                    _ => ""
                }
            }
        }
    })
}
