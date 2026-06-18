import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type CreateAdminUserBody = {
  full_name: string;
  email: string;
  temporary_password: string;
  role: string;
};

const ADDA_SUPABASE_URL = Deno.env.get("ADDA_SUPABASE_URL") ?? "";
const ADDA_SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("ADDA_SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405);
    }

    if (!ADDA_SUPABASE_URL || !ADDA_SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse(
        { error: "Faltan variables de entorno requeridas." },
        500,
      );
    }

    const body = (await req.json()) as CreateAdminUserBody;

    const fullName = body.full_name?.trim();
    const email = body.email?.trim().toLowerCase();
    const temporaryPassword = body.temporary_password;
    const role = body.role?.trim();

    if (!fullName || !email || !temporaryPassword || !role) {
      return jsonResponse(
        {
          error: "Nombre, correo, contraseña temporal y rol son obligatorios.",
        },
        400,
      );
    }

    if (temporaryPassword.length < 8) {
      return jsonResponse(
        { error: "La contraseña temporal debe tener mínimo 8 caracteres." },
        400,
      );
    }

    const supabase = createClient(
      ADDA_SUPABASE_URL,
      ADDA_SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("name")
      .eq("name", role)
      .eq("is_active", true)
      .maybeSingle();

    if (roleError) throw roleError;

    if (!roleData) {
      return jsonResponse(
        { error: "El rol seleccionado no existe o está inactivo." },
        400,
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      });

    if (authError) throw authError;

    const userId = authData.user?.id;

    if (!userId) {
      return jsonResponse(
        { error: "No fue posible crear el usuario Auth." },
        400,
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: userId,
        email,
        full_name: fullName,
        role,
        is_active: true,
      },
    ]);

    if (profileError) throw profileError;

    const { error: userRoleError } = await supabase.from("user_roles").insert([
      {
        user_id: userId,
        role,
      },
    ]);

    if (userRoleError) throw userRoleError;

    return jsonResponse({
      success: true,
      user_id: userId,
      email,
      role,
    });
  } catch (error) {
    console.error("CREATE_ADMIN_USER_ERROR", error);

    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "No fue posible crear el usuario.";

    return jsonResponse(
      {
        error: message,
        detail: error,
      },
      400,
    );
  }
});
