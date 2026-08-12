import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCurrentAuth, logoutFromApp } from "@/lib/app-api";
import type { AppUser, AuthState, Profile, SignupRequestStatus } from "@/lib/app-types";
import { can, type AppLevel, type Permission } from "@/lib/permissions";

type Session = { user: AppUser } | null;

type AuthContextValue = {
  session: Session | null;
  user: AppUser | null;
  profile: Profile | null;
  level: AppLevel | null;
  signupRequestStatus: SignupRequestStatus | null;
  approvedAccess: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [level, setLevel] = useState<AppLevel | null>(null);
  const [signupRequestStatus, setSignupRequestStatus] = useState<SignupRequestStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const applyState = (next: AuthState) => {
    setSession(next.user ? { user: next.user } : null);
    setProfile(next.profile);
    setLevel(next.level);
    setSignupRequestStatus(next.signupRequestStatus);
  };

  const loadAuth = async () => {
    const next = await getCurrentAuth();
    applyState(next);
  };

  useEffect(() => {
    void loadAuth().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      level,
      signupRequestStatus,
      approvedAccess: Boolean(profile && level),
      loading,
      refresh: async () => {
        await loadAuth();
      },
      signOut: async () => {
        await logoutFromApp();
        applyState({
          user: null,
          profile: null,
          level: null,
          signupRequestStatus: null,
          approvedAccess: false,
        });
      },
      hasPermission: (permission: Permission) => can(level, permission),
    }),
    [session, profile, level, signupRequestStatus, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
