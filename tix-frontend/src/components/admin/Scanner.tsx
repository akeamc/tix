"use client";

import { Transition } from "@headlessui/react";
import classNames from "classnames";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import ScanResult from "./ScanResult";
import Nav from "./Nav";
import { CameraOff } from "react-feather";

export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>();

  useEffect(() => {
    if (!cameraAvailable) return;

    const scanner = new QrScanner(
      video.current!,
      (result) => {
        if (!result.data) return; // it returns an empty string sometimes
        setDecoded((prev) => prev ?? result.data);
      },
      {
        calculateScanRegion: (video) => {
          return {
            x: 0,
            y: 0,
            width: video.videoWidth,
            height: video.videoHeight,
          };
        },
      },
    );

    async function init() {
      try {
        await scanner.start();
      } catch (error) {
        console.error(error);
      }
    }

    init();

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [cameraAvailable]);

  async function checkCamera() {
    setCameraAvailable(await QrScanner.hasCamera());
  }

  useEffect(() => {
    checkCamera();
  }, []);

  const showResult = decoded !== null;

  return (
    <div className="relative h-screen">
      <Nav transparent className="relative z-10" />
      <div className="absolute inset-0 bg-black">
        <video ref={video} className="size-full object-cover" />
        {cameraAvailable === false && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
            <CameraOff className="size-8" />
            <p className="text-center text-white">
              Kontrollera att webbplatsen har tillgång till kameran.
            </p>
            <button
              onClick={() => checkCamera()}
              className=" rounded-lg bg-white px-4 py-2 text-black"
            >
              Försök igen
            </button>
          </div>
        )}
      </div>
      <div
        className={classNames("fixed inset-0 overflow-y-auto pt-40", {
          "pointer-events-none": !showResult,
        })}
      >
        <button
          className={classNames(
            "absolute inset-0 bg-[#00000080] transition-opacity",
            { "opacity-0": !showResult },
          )}
          onClick={() => setDecoded(null)}
          title="Dölj"
        />
        <Transition
          show={decoded !== null}
          enter="transition-all duration-300"
          enterFrom="translate-y-1/2 opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="transition-all"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="translate-y-1/2 opacity-0"
          className="relative z-10 flex min-h-full flex-col rounded-t-3xl bg-white p-4"
        >
          <ScanResult id={decoded!} dismiss={() => setDecoded(null)} />
          <div className="mt-auto pt-2">
            <button
              onClick={() => setDecoded(null)}
              className="w-full rounded-lg bg-black py-4 font-medium text-white shadow-sm"
            >
              Stäng
            </button>
          </div>
        </Transition>
      </div>
    </div>
  );
}
