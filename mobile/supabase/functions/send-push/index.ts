import { createClient } from "@supabase/supabase-js";
import { SignJWT, importPKCS8 } from "jose";

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let cached: { value: string; expiresAt: number } | null = null;

async function getAccessToken(
  clientEmail: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 60 > now) return cached.value;

  const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const data = await res.json();
  cached = {
    value: data.access_token as string,
    expiresAt: now + (Number(data.expires_in) || 3600),
  };
  return cached.value;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const projectId = Deno.env.get("FCM_PROJECT_ID");
  const clientEmail = Deno.env.get("FCM_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FCM_PRIVATE_KEY");
  const sharedSecret = Deno.env.get("PUSH_SHARED_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!projectId || !clientEmail || !privateKey || !sharedSecret) {
    return json({ error: "server not configured" }, 500);
  }
  if ((req.headers.get("x-push-secret") ?? "") !== sharedSecret) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: {
    user_id?: string;
    title?: string;
    body?: string;
    notification_id?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const { user_id, title, body, notification_id } = payload;
  if (!user_id || !title || !body) return json({ error: "missing fields" }, 400);

  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: devices, error } = await supabase
    .from("customer_devices")
    .select("id, fcm_token")
    .eq("user_id", user_id);
  if (error) return json({ error: "device lookup failed" }, 500);
  if (!devices || devices.length === 0) {
    return json({ sent: 0, failed: 0, removed: 0 });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(clientEmail, privateKey);
  } catch (err) {
    console.error("OAuth failed:", err);
    return json({ error: "oauth failed", details: String(err) }, 502);
  }

  const endpoint =
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const device of devices) {
    const message = {
      message: {
        token: device.fcm_token,
        notification: { title, body },
        android: { priority: "high" },
        data: { kind: "order", notification_id: notification_id ?? "" },
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (res.ok) {
      sent += 1;
      continue;
    }

    failed += 1;
    let errorCode = "";
    try {
      const errBody = await res.json();
      errorCode = errBody?.error?.details?.[0]?.errorCode ??
        errBody?.error?.status ??
        "";
    } catch {
      // ignore
    }
    console.error(`FCM failed for token ${device.fcm_token}: ${res.status} ${errorCode}`);

    if (errorCode === "UNREGISTERED" || errorCode === "INVALID_ARGUMENT") {
      await supabase.from("customer_devices").delete().eq("id", device.id);
      removed += 1;
    }
  }

  return json({ sent, failed, removed });
});
