type VideoToolSession = {
  accessToken: string;
  userId: string;
  baseUrl: string;
  anonKey: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Fehlende Server-Konfiguration: ${name}`);
  return value;
}

export async function getVideoToolSession(): Promise<VideoToolSession> {
  const baseUrl = required("VIDEO_TOOL_SUPABASE_URL");
  const anonKey = required("VIDEO_TOOL_SUPABASE_ANON_KEY");
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: required("VIDEO_TOOL_USER_EMAIL"),
      password: required("VIDEO_TOOL_USER_PASSWORD"),
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("VideoTool-Anmeldung fehlgeschlagen.");
  const data = (await response.json()) as { access_token: string; user: { id: string } };
  return { accessToken: data.access_token, userId: data.user.id, baseUrl, anonKey };
}

export function videoToolHeaders(session: VideoToolSession, prefer?: string) {
  return {
    apikey: session.anonKey,
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function videoToolRequest<T>(
  session: VideoToolSession,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${session.baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...videoToolHeaders(session), ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`VideoTool-Datenbankfehler (${response.status}): ${detail}`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? JSON.parse(text) as T : undefined as T;
}
