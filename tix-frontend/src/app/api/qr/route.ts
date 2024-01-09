import { NextRequest } from "next/server";

export interface SwishPayment {
  payee: {
    value: string;
    editable: boolean;
  };
  amount: {
    value: number;
    editable: boolean;
  };
  /**
   * Message for payment. Max 50 characters. Common allowed characters are the
   * letters a-ö, A-Ö, the numbers 0-9, and special characters `!?(),.-:;`
   */
  message: {
    value: string;
    editable: boolean;
  };
}

export interface QrRequest extends SwishPayment {
  format: "jpg" | "png" | "svg";
  /**
   * Size of the QR code. The code is a square, so width and height are the
   * same. Not required if the format is svg. Minimum 300.
   */
  size?: number;
  /**
   * Width of the border.
   */
  border?: number;
  transparent?: boolean;
}

async function getQr(req: QrRequest) {
  const res = await fetch(
    "https://mpc.getswish.net/qrg-swish/api/v1/prefilled",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    },
  );

  if (res.status === 200) {
    return res;
  }

  throw new Error("Failed to get QR code");
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const payee = params.get("payee") as string;
  const amount = parseInt(params.get("amount") as string);
  const message = params.get("message") as string;

  const qr = await getQr({
    format: "svg",
    payee: {
      value: payee,
      editable: false,
    },
    amount: {
      value: amount,
      editable: false,
    },
    message: {
      value: message,
      editable: false,
    },
    border: 0,
    transparent: true,
  });

  return new Response(qr.body, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
