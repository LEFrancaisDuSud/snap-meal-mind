import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNSUser } from "@/hooks/useNSUser";

export default function AuthGate({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const { user: ns, loading: nsLoading } = useNSUser();
  const loc = useLocation();

  if (authLoading || (user && nsLoading)) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;
  if (requireOnboarding && ns && !ns.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
