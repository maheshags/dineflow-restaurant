const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5000";

export const API_BASE_URL = API_BASE.endsWith("/api") ? API_BASE : `${API_BASE}/api`;

export default API_BASE_URL;

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem("adminToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, redirect to login
  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    window.location.href = "/";
  }

  return response;
};

// Convenience methods
export const apiGet = (endpoint: string) =>
  apiCall(endpoint, { method: "GET" });

export const apiPost = (endpoint: string, body: any) =>
  apiCall(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPut = (endpoint: string, body: any) =>
  apiCall(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const apiDelete = (endpoint: string) =>
  apiCall(endpoint, { method: "DELETE" });
