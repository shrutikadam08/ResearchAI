const configuredApiUrl = import.meta.env.VITE_API_URL;

const normalizeApiUrl = (value) => {
  if (!value) {
    return "http://127.0.0.1:8000";
  }

  return value.replace(/\/+$/, "");
};

export const API_URL =
  normalizeApiUrl(configuredApiUrl);