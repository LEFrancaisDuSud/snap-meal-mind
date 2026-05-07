import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";

import AuthPage from "./pages/AuthPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import PaywallPage from "./pages/PaywallPage";
import HomePage from "./pages/HomePage";
import MealsPage from "./pages/MealsPage";
import ProgressPage from "./pages/ProgressPage";
import ProfilePage from "./pages/ProfilePage";
import LogPage from "./pages/LogPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "#0D0D0D",
            border: "1px solid #222",
            color: "#fff",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/onboarding" element={<AuthGate requireOnboarding={false}><OnboardingPage /></AuthGate>} />
          <Route path="/paywall" element={<AuthGate requireOnboarding={false}><PaywallPage /></AuthGate>} />

          <Route element={<AppShell />}>
            <Route path="/" element={<AuthGate><HomePage /></AuthGate>} />
            <Route path="/meals" element={<AuthGate><MealsPage /></AuthGate>} />
            <Route path="/progress" element={<AuthGate><ProgressPage /></AuthGate>} />
            <Route path="/profile" element={<AuthGate><ProfilePage /></AuthGate>} />
          </Route>

          <Route element={<AppShell hideNav />}>
            <Route path="/log" element={<AuthGate><LogPage /></AuthGate>} />
          </Route>

          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
