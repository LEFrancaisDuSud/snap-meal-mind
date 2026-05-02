import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "@/components/AppShell";
import AuthGate from "@/components/AuthGate";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import HomePage from "./pages/HomePage";
import StatsPage from "./pages/StatsPage";
import ScannerPage from "./pages/ScannerPage";
import JournalPage from "./pages/JournalPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<AppShell />}>
            <Route path="/" element={<AuthGate><HomePage /></AuthGate>} />
            <Route path="/stats" element={<AuthGate><StatsPage /></AuthGate>} />
            <Route path="/journal" element={<AuthGate><JournalPage /></AuthGate>} />
            <Route path="/profil" element={<AuthGate><ProfilePage /></AuthGate>} />
          </Route>

          <Route element={<AppShell hideNav />}>
            <Route path="/scanner" element={<AuthGate><ScannerPage /></AuthGate>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
