const API_BASE = "/.netlify/functions";

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const text = await response.text();
    return text ? { raw: text } : {};
  }

  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  const { method = "GET", data, token, headers = {}, ...rest } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}/${endpoint}`, config);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(
      payload?.error || payload?.message || "Request failed"
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
};

export default apiRequest;
