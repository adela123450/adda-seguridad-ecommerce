// supabase/functions/create-wompi-transaction/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const WOMPI_PUBLIC_KEY = Deno.env.get("WOMPI_PUBLIC_KEY") ?? "";
const WOMPI_INTEGRITY_SECRET = Deno.env.get("WOMPI_INTEGRITY_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("ADDA_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("ADDA_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";

const getSiteOrigin = () => {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return "";
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": getSiteOrigin(),
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

type RequestBody = {
  order_id: string;
};

const createSha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método no permitido." }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    if (
      !WOMPI_PUBLIC_KEY ||
      !WOMPI_INTEGRITY_SECRET ||
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE_KEY ||
      !SITE_URL
    ) {
      throw new Error("Faltan variables de entorno requeridas.");
    }

    const body = (await req.json()) as RequestBody;

    if (!body.order_id) {
      throw new RequestError("order_id es obligatorio.", 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: settings, error: settingsError } = await supabase
      .from("business_settings")
      .select("payment_mode")
      .limit(1)
      .maybeSingle();

    if (settingsError) throw settingsError;

    if (settings?.payment_mode === "solo_transferencia") {
      throw new RequestError(
        "Wompi no está habilitado en la configuración de pagos.",
        400
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, total_price, email, customer_name, payment_method, payment_status"
      )
      .eq("id", body.order_id)
      .maybeSingle();

    if (orderError) throw orderError;

    if (!order) {
      throw new RequestError("La orden no existe.", 404);
    }

    if (order.payment_method !== "wompi") {
      throw new RequestError(
        "La orden no fue creada con método de pago Wompi.",
        400
      );
    }

    if (order.payment_status === "approved") {
      throw new RequestError("Esta orden ya fue pagada.", 409);
    }

    const amountInCents = Math.round(Number(order.total_price) * 100);

    if (amountInCents <= 0) {
      throw new RequestError("El valor de la orden no es válido.", 400);
    }

    const reference = `${order.order_number}-${Date.now()}`;
    const currency = "COP";

    const integritySignature = await createSha256(
      `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`
    );

    const redirectUrl = `${SITE_URL}/pago/wompi/resultado?reference=${reference}`;

    const { error: rpcError } = await supabase.rpc(
      "register_wompi_payment_transaction",
      {
        p_order_id: order.id,
        p_reference: reference,
        p_amount_in_cents: amountInCents,
        p_currency: currency,
        p_payment_method: "wompi",
        p_customer_email: order.email,
        p_customer_name: order.customer_name,
        p_integrity_signature: integritySignature,
        p_redirect_url: redirectUrl,
        p_raw_request: {
          order_id: order.id,
          order_number: order.order_number,
        },
        p_raw_response: null,
      }
    );

    if (rpcError) throw rpcError;

    return new Response(
      JSON.stringify({
        publicKey: WOMPI_PUBLIC_KEY,
        reference,
        amountInCents,
        currency,
        integritySignature,
        redirectUrl,
        customerEmail: order.email,
        customerName: order.customer_name,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("CREATE_WOMPI_TRANSACTION_ERROR", error);

    const isRequestError = error instanceof RequestError;

    return new Response(
      JSON.stringify({
        error: isRequestError
          ? error.message
          : "No fue posible crear la transacción Wompi.",
      }),
      {
        status: isRequestError ? error.status : 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});