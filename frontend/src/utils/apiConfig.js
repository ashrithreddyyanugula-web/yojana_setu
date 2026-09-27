export const VITE_API_URL = (import.meta.env.VITE_API_URL
    || (import.meta.env.DEV
        ? "http://localhost:5001"
        : "https://backendyojana-setu-backend.vercel.app")).replace(/\/+$/, "");

export const API_BASE_URL = VITE_API_URL;
export const CHAT_API_URL = `${API_BASE_URL}/api/chat`;