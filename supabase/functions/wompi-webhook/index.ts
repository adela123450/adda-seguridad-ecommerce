import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type WompiTransaction = {
  id?: string;
  status?: string;
  reference?: string;
  amount_in_cents?: number;
};

type WompiEventPayload = {
  event?: string;
  data?: {
    transaction?: WompiTransaction;
  };
  signature?: {
    properties?: string[];
    checksum?: string;
  };
  timestamp?: number;
};

const ADDA_SUPABASE_URL = Deno.env.get("ADDA_SUPABASE_URL") ?? "";
const ADDA_SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("ADDA_SUPABASE_SERVICE_ROLE_KEY") ?? "";

const WOMPI_EVENTS_SECRET =
  Deno.env.get("WOMPI_EVENTS_SECRET") ??
  Deno.env.get("WOMPI_INTEGRITY_SECRET") ??
  "";

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const createSha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const secureEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let difference = 0;

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
};

const getValueByPath = (
  payload: WompiEventPayload,
  path: string
): string => {
  const parts = path.split(".");
  let currentValue: unknown = payload.data;

  for (const part of parts) {
    if (
      typeof currentValue !== "object" ||
      currentValue === null ||
      !(part in currentValue)
    ) {
      return "";
    }

    currentValue = (currentValue as Record<string, unknown>)[part];
  }

  return String(currentValue ?? "");
};

const validateWompiSignature = async (payload: WompiEventPayload) => {
  const properties = payload.signature?.properties ?? [];
  const checksum = payload.signature?.checksum;
  const timestamp = payload.timestamp;

  if (!checksum || !timestamp || properties.length === 0) {
    return false;
  }

  const concatenatedValues = properties
    .map((property) => getValueByPath(payload, property))
    .join("");

  const calculatedChecksum = await createSha256(
    `${concatenatedValues}${timestamp}${WOMPI_EVENTS_SECRET}`
  );

  return secureEqual(calculatedChecksum, checksum.toLowerCase());
};

const mapWompiStatus = (status: string) => {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "APPROVED") return "approved";
  if (normalizedStatus === "DECLINED") return "declined";
  if (normalizedStatus === "VOIDED") return "voided";
  if (normalizedStatus === "ERROR") return "error";

  return "pending";
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405);
    }

    if (
      !ADDA_SUPABASE_URL ||
      !ADDA_SUPABASE_SERVICE_ROLE_KEY ||
      !WOMPI_EVENTS_SECRET
    ) {
      return jsonResponse(
        { error: "Faltan variables de entorno requeridas." },
        500
      );
    }

    const payload = (await req.json()) as WompiEventPayload;

    const isValidSignature = await validateWompiSignature(payload);

    if (!isValidSignature) {
      return jsonResponse({ error: "Firma Wompi inválida." }, 401);
    }

    const supabase = createClient(
      ADDA_SUPABASE_URL,
      ADDA_SUPABASE_SERVICE_ROLE_KEY
    );

    const transaction = payload.data?.transaction;
    const eventType = payload.event ?? "unknown";
    const wompiTransactionId = transaction?.id ?? null;
    const reference = transaction?.reference ?? null;
    const wompiStatus = transaction?.status ?? "UNKNOWN";
    const paymentStatus = mapWompiStatus(wompiStatus);

    const { data: webhookLog, error: webhookLogError } = await supabase
      .from("webhook_logs")
      .insert([
        {
          provider: "wompi",
          event_id: wompiTransactionId,
          event_type: eventType,
          reference,
          wompi_transaction_id: wompiTransactionId,
          status: "received",
          payload,
        },
      ])
      .select("id")
      .single();

    if (webhookLogError) {
      return jsonResponse(
        { error: "No fue posible registrar el webhook." },
        400
      );
    }

    if (!reference || !wompiTransactionId) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "error",
          error_message: "Webhook sin referencia o transaction_id.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLog.id);

      return jsonResponse(
        { error: "Webhook sin referencia o transaction_id." },
        400
      );
    }

    const { data: paymentTransaction, error: transactionError } =
      await supabase
        .from("payment_transactions")
        .select("id, order_id")
        .eq("reference", reference)
        .maybeSingle();

    if (transactionError || !paymentTransaction) {
      await supabase
        .from("webhook_logs")
        .update({
          status: "error",
          error_message: "No se encontró la transacción financiera.",
          processed_at: new Date().toISOString(),
        })
        .eq("id", webhookLog.id);

      return jsonResponse(
        { error: "No se encontró la transacción financiera." },
        404
      );
    }

    await supabase.from("payment_events").insert([
      {
        transaction_id: paymentTransaction.id,
        order_id: paymentTransaction.order_id,
        provider: "wompi",
        event_type: eventType,
        event_status: paymentStatus,
        payload,
      },
    ]);

    if (paymentStatus === "approved") {
      const { error: approveError } = await supabase.rpc(
        "mark_wompi_payment_approved",
        {
          p_order_id: paymentTransaction.order_id,
          p_wompi_transaction_id: wompiTransactionId,
          p_reference: reference,
        }
      );

      if (approveError) throw approveError;
    }

    if (
      paymentStatus === "declined" ||
      paymentStatus === "voided" ||
      paymentStatus === "error"
    ) {
      const { error: notApprovedError } = await supabase.rpc(
        "mark_wompi_payment_not_approved",
        {
          p_order_id: paymentTransaction.order_id,
          p_wompi_transaction_id: wompiTransactionId,
          p_reference: reference,
          p_payment_status: paymentStatus,
        }
      );

      if (notApprovedError) throw notApprovedError;
    }

    await supabase
      .from("webhook_logs")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", webhookLog.id);

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("WOMPI_WEBHOOK_ERROR", error);

    return jsonResponse(
      { error: "Error procesando webhook Wompi." },
      500
    );
  }
});