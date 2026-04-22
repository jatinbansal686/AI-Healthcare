import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { UserProfile } from "@/types";

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean; // NEW — true only after first auth check completes
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  reset: () =>
    set({ session: null, profile: null, loading: false, initialized: true }),
}));
