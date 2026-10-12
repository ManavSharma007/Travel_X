import axios from "axios";
import * as SecureStore from "expo-secure-store";

// The base URL comes from .env (EXPO_PUBLIC_ vars are exposed to the app).
// On a physical phone, this must be your computer's LAN IP, not localhost.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const TOKEN_KEY = "travelx_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Attach the saved JWT to every request automatically.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
