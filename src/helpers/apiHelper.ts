const ACCESS_TOKEN_KEY = "accessToken";

export interface ApiResponse<T = unknown> {
  status: string;
  message: string;
  data?: T;
}

export type QueryValue = string | number | null | undefined;

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown> | FormData;
  query?: Record<string, QueryValue>;
  auth?: boolean;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function putAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function buildUrl(path: string, query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  }
  const search = params.toString();
  const queryString = search ? "?" + search : "";
  return `${DELCOM_BASEURL}${path}${queryString}`;
}

/** Menggabungkan pesan validasi `{ field: ["pesan"] }` dari API menjadi satu kalimat. */
function extractMessage(json: Partial<ApiResponse>, status: number): string {
  const details =
    json.data && typeof json.data === "object"
      ? Object.values(json.data as Record<string, unknown>)
          .flat()
          .filter((item): item is string => typeof item === "string")
      : [];
  if (details.length > 0) return details.join(" ");
  return json.message || `Terjadi kesalahan pada server (${status})`;
}

export async function fetchApi<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", body, query, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };

  const token = getAccessToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { method, headers, body: payload });
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Periksa koneksi internet kamu.", 0);
  }

  let json: Partial<ApiResponse<T>>;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  if (!response.ok || json.status !== "success") {
    if (response.status === 401) {
      removeAccessToken();
    }
    throw new ApiError(extractMessage(json, response.status), response.status);
  }

  return json as ApiResponse<T>;
}
