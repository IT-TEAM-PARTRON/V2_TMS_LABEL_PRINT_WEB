import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../api/auth/login.js";

const AuthContext = createContext();
const IDLE_TIMEOUT = 60 * 60 * 1000;

const readStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("auth")) || null;
  } catch {
    localStorage.removeItem("auth");
    return null;
  }
};

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(readStoredAuth);

  const clearSession = useCallback(() => {
    setAuth(null);
    localStorage.removeItem("auth");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // The local session must still be cleared if the server is unavailable.
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  }, [clearSession, navigate]);

  const login = useCallback((data) => setAuth(data), []);

  useEffect(() => {
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
  }, [auth]);

  useEffect(() => {
    if (!auth) return undefined;

    let idleTimer;
    let throttleTimer;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void logout(), IDLE_TIMEOUT);
    };

    const handleActivity = () => {
      if (throttleTimer) return;
      resetIdleTimer();
      throttleTimer = setTimeout(() => {
        throttleTimer = undefined;
      }, 60 * 1000);
    };

    const events = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetIdleTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(idleTimer);
      clearTimeout(throttleTimer);
    };
  }, [auth, logout]);

  useEffect(() => {
    const syncStorage = (event) => {
      if (event.key === "auth") setAuth(readStoredAuth());
    };
    const expireSession = () => {
      clearSession();
      navigate("/login", { replace: true });
    };
    const showAccessDenied = (event) => {
      navigate("/403", {
        replace: true,
        state: { attemptedPath: event.detail?.attemptedPath },
      });
    };

    window.addEventListener("storage", syncStorage);
    window.addEventListener("sessionExpired", expireSession);
    window.addEventListener("accessDenied", showAccessDenied);

    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener("sessionExpired", expireSession);
      window.removeEventListener("accessDenied", showAccessDenied);
    };
  }, [clearSession, navigate]);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
