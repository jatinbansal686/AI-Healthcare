import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ChatPage from "@/pages/ChatPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AdminPage from "@/pages/AdminPage";
import TherapistDashboard from "@/pages/TherapistDashboard";
import GoogleOAuthCallback from "@/pages/GoogleOAuthCallback";
import NotFoundPage from "@/pages/NotFoundPage";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabaseClient";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

async function fetchAndSetProfile(userId: string) {
  const { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export default function App() {
  const { setSession, setProfile, setLoading, setInitialized, initialized } =
    useAuthStore();

  useEffect(() => {
    // Step 1: get existing session from localStorage (synchronous in Supabase v2)
    // Then fetch profile — only THEN mark as initialized
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user) {
          const profile = await fetchAndSetProfile(session.user.id);
          setProfile(profile);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        // Always mark done — even on error — so the app doesn't hang
        setLoading(false);
        setInitialized(true);
      }
    };

    init();

    // Step 2: listen for future auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (session?.user) {
        const profile = await fetchAndSetProfile(session.user.id);
        setProfile(profile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Don't render routes at all until we know the auth state
  // This is the key fix — prevents ProtectedRoute from redirecting during init
  if (!initialized) return <LoadingSpinner fullScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth/callback" element={<GoogleOAuthCallback />} />

        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route path="/" element={<ChatPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["therapist"]} />}>
          <Route path="/therapist" element={<TherapistDashboard />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
