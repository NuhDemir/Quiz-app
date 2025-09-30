import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import { apiRequest } from "../utils/apiClient";
import { logout } from "../store/authSlice";

// This component listens to Clerk auth state and, when signed in, exchanges a Clerk JWT for backend JWT.
// Usage: Place inside App (perhaps near Routes) so that it runs globally.

export default function ClerkAuthBridge({ onAuthenticated }) {
  const { isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const dispatch = useDispatch();
  const [status, setStatus] = useState("idle"); // idle | exchanging | error | done

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!isSignedIn) {
        return;
      }
      setStatus("exchanging");
      try {
        // Get Clerk JWT (frontend) - specify template if configured else default
        const clerkToken = await getToken({ template: "default" }).catch(() =>
          getToken()
        );
        if (!clerkToken) throw new Error("Clerk token alınamadı");

        const data = await apiRequest("auth-social-clerk", {
          method: "POST",
          data: { clerkToken },
        });
        if (cancelled) return;
        // Persist handled by auth slice thunk style not used here. We'll store directly.
        localStorage.setItem(
          "authState",
          JSON.stringify({ user: data.user, token: data.token })
        );
        if (onAuthenticated) onAuthenticated(data);
        setStatus("done");
      } catch (err) {
        console.error("[ClerkAuthBridge] Exchange failed", err);
        setStatus("error");
        // Optional: signOut() or keep Clerk session but no backend session
      }
    }
    sync();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, dispatch, user, onAuthenticated]);

  if (!isSignedIn) return null;
  return null; // silent component
}
