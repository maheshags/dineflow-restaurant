import API_BASE_URL from "./api";

export interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

export interface LoginResponse {
  token?: string;
  user?: {
    _id: string;
    name?: string;
    email: string;
    role?: string;
  };
  message?: string;
}

export const loginAdmin = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};