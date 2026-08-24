import { createFileRoute } from "@tanstack/react-router";

function cookieValue(header: string | null, name: string) {
  if (!header) return "";
  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rest.join("=") || "");
  }
  return "";
}

function htmlEscapeForScript(value: string) {
  return JSON.stringify(value);
}

export const Route = createFileRoute("/api/auth/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        Response.redirect(new URL("/", request.url).toString(), 302),

      POST: async ({ request }) => {
        const form = await request.formData();
        const credential = String(form.get("credential") || "");
        const bodyToken = String(form.get("g_csrf_token") || "");
        const cookieToken = cookieValue(request.headers.get("cookie"), "g_csrf_token");

        if (!credential || !bodyToken || !cookieToken || bodyToken !== cookieToken) {
          return new Response("Google sign-in failed (CSRF or missing credential).", {
            status: 400,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }

        const origin = new URL(request.url).origin;
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Signing in…</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: #050406; color: #fff; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <p>Signing in…</p>
  <script>
    try {
      sessionStorage.setItem("kataro_google_credential", ${htmlEscapeForScript(credential)});
    } catch (e) {}
    location.replace(${htmlEscapeForScript(origin + "/")});
  </script>
</body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
