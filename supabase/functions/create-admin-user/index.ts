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
  let createdUserId: string | null = null;
  let supabase: ReturnType<typeof createClient> | null = null;

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido." }, 405);
    }

    if (!ADDA_SUPABASE_URL || !ADDA_SUPABASE_SERVICE_ROLE_KEY || !SITE_URL) {
      return jsonResponse(
        { error: "Faltan variables de entorno requeridas." },
        500
      );
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();

    if (!accessToken) {
      return jsonResponse({ error: "Autenticación requerida." }, 401);
    }

    supabase = createClient(
      ADDA_SUPABASE_URL,
      ADDA_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: requesterData, error: requesterError } =
      await supabase.auth.getUser(accessToken);

    if (requesterError || !requesterData.user) {
      return jsonResponse({ error: "Sesión inválida o vencida." }, 401);
    }

    const requesterId = requesterData.user.id;

    const [{ data: requesterProfile }, { data: requesterRole }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("is_active")
          .eq("id", requesterId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", requesterId)
          .eq("role", "super_admin")
          .maybeSingle(),
      ]);

    if (!requesterProfile?.is_active || !requesterRole) {
      return jsonResponse(
        {
          error:
            "No tienes autorización para crear usuarios administrativos.",
        },
        403
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
        400
      );
    }

    if (temporaryPassword.length < 8) {
      return jsonResponse(
        { error: "La contraseña temporal debe tener mínimo 8 caracteres." },
        400
      );
    }

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
        400
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
        400
      );
    }

    createdUserId = userId;

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

    createdUserId = null;

    return jsonResponse({
      success: true,
      user_id: userId,
      email,
      role,
    });
  } catch (error) {
    console.error("CREATE_ADMIN_USER_ERROR", error);

    if (createdUserId && supabase) {
      const { error: rollbackError } =
        await supabase.auth.admin.deleteUser(createdUserId);

      if (rollbackError) {
        console.error("CREATE_ADMIN_USER_ROLLBACK_ERROR", rollbackError);
      }
    }

    return jsonResponse(
      { error: "No fue posible crear el usuario administrativo." },
      400
    );
  }
});