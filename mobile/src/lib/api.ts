import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://10.0.2.2:8000/api/v1"; // Android emulator → localhost

async function request(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem("access_token");

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
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Bir hata oluştu");
  }

  return res.json();
}

export const api = {
  register: (data: { email: string; password: string; full_name: string }) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request("/auth/me"),

  createHealthData: (data: Record<string, unknown>) =>
    request("/health-data", { method: "POST", body: JSON.stringify(data) }),

  getHealthData: () => request("/health-data"),

  updateHealthData: (id: number, data: Record<string, unknown>) =>
    request(`/health-data/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteHealthData: (id: number) =>
    request(`/health-data/${id}`, { method: "DELETE" }),

  // Image Analysis
  uploadAndAnalyzeImage: async (uri: string, fileName: string, mimeType: string) => {
    const token = await AsyncStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);

    const res = await fetch(`${API_URL}/image-analysis`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.status === 401) {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Görsel analizi başarısız");
    }

    return res.json();
  },

  getImageAnalyses: () => request("/image-analysis"),

  getImageAnalysis: (id: number) => request(`/image-analysis/${id}`),

  deleteImageAnalysis: (id: number) =>
    request(`/image-analysis/${id}`, { method: "DELETE" }),
};
