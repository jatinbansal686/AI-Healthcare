import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { session, profile, loading } = useAuthStore();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile && !allowedRoles.includes(profile.role)) {
    const redirectMap: Record<UserRole, string> = {
      patient: "/chat",
      therapist: "/therapist",
      admin: "/admin",
    };
    return <Navigate to={redirectMap[profile.role]} replace />;
  }
  return <Outlet />;
}
