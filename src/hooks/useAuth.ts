import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/useToast";

export function useAuth() {
  const { session, profile, loading, reset } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          // After email confirmation, redirect here
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    },
    [toast],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Fetch profile to get role for redirect
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profileData?.role ?? "patient";
      const redirectMap: Record<string, string> = {
        patient: "/chat",
        therapist: "/therapist",
        admin: "/admin",
      };
      navigate(redirectMap[role] ?? "/chat", { replace: true });
    },
    [navigate],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
    navigate("/login", { replace: true });
  }, [navigate, reset]);

  return { session, profile, loading, signUp, signIn, signOut };
}
