import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 5000,
});

const readAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("auth")) || null;
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
};

api.interceptors.request.use((config) => {
  const auth = readAuth();
  const token = auth?.userInfo?.accessToken || auth?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const language =
    localStorage.getItem("language") || localStorage.getItem("i18nextLng");
  if (language) config.headers["Accept-Language"] = language;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;

    if (!response) {
      window.dispatchEvent(
        new CustomEvent("globalError", {
          detail: "Unable to connect to the server. Please check your network.",
        }),
      );
      return Promise.reject(error);
    }

    const isLoginOrLogout = ["/auth/login", "/auth/logout"].some((path) =>
      config?.url?.includes(path),
    );

    if (response.status === 401 && !isLoginOrLogout) {
      localStorage.removeItem("auth");
      window.dispatchEvent(new Event("sessionExpired"));
    }

    if (response.status === 403) {
      window.dispatchEvent(
        new CustomEvent("accessDenied", {
          detail: { attemptedPath: window.location.pathname },
        }),
      );
    }

    if (response.status >= 500) {
      window.dispatchEvent(
        new CustomEvent("globalError", {
          detail: response.data?.message || "Internal server error",
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
