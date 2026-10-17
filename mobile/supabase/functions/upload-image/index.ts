import { createClient } from "@supabase/supabase-js";
import { AwsClient } from "aws4fetch";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildKey(ext: string): string {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `products/${yyyy}/${mm}/${crypto.randomUUID()}.${ext}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "طريقة غير مدعومة." }, 405);
  }

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "مطلوب تسجيل الدخول." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return json({ error: "إعدادات Supabase غير مكتملة." }, 500);
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await client.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "جلسة غير صالحة." }, 401);

  const { data: isAdmin, error: adminError } = await client.rpc("is_store_admin");
  if (adminError) return json({ error: "تعذّر التحقق من صلاحيات المدير." }, 500);
  if (isAdmin !== true) return json({ error: "هذا الحساب ليس مديرًا للمتجر." }, 403);

  const contentType = (req.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) return json({ error: "صيغة غير مدعومة. استخدم PNG أو JPG أو WebP." }, 415);

  const buffer = await req.arrayBuffer();
  if (buffer.byteLength === 0) return json({ error: "لم يتم إرسال أي صورة." }, 400);
  if (buffer.byteLength > MAX_BYTES) return json({ error: "حجم الصورة أكبر من 5 MB." }, 413);

  const endpoint = Deno.env.get("R2_ENDPOINT");
  const bucket = Deno.env.get("R2_BUCKET");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
  const publicBaseUrl = (Deno.env.get("R2_PUBLIC_BASE_URL") || "").replace(/\/+$/, "");
  const region = Deno.env.get("R2_REGION") || "auto";
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
    return json({ error: "إعدادات التخزين غير مكتملة." }, 500);
  }

  const key = buildKey(ext);
  const objectUrl = `${endpoint.replace(/\/+$/, "")}/${bucket}/${key}`;
  const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region });

  let uploadResponse: Response;
  try {
    uploadResponse = await aws.fetch(objectUrl, {
      method: "PUT",
      body: buffer,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return json({ error: "تعذّر الاتصال بخادم التخزين." }, 502);
  }
  if (!uploadResponse.ok) {
    return json({ error: `فشل رفع الصورة (${uploadResponse.status}).` }, 502);
  }

  return json({ image_url: `${publicBaseUrl}/${key}`, key }, 201);
});