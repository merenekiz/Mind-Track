const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    throw new Error("Yetkisiz");
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Bir hata oluştu");
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; full_name: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request("/auth/me"),

  // Health Data
  createHealthData: (data: Record<string, unknown>) =>
    request("/health-data", { method: "POST", body: JSON.stringify(data) }),

  getHealthData: () => request("/health-data"),

  updateHealthData: (id: number, data: Record<string, unknown>) =>
    request(`/health-data/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteHealthData: (id: number) =>
    request(`/health-data/${id}`, { method: "DELETE" }),
};
