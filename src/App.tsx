import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AUTH_CHANGED_EVENT } from "@/lib/auth";
import { PlayerProvider } from "@/lib/player";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import { getToken } from "@/lib/auth";
import AIRecommendations from "./pages/AIRecommendations";
import AIGenerator from "./pages/AIGenerator";
import Social from "./pages/Social";
import TestLab from "./pages/TestLab";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => {
  const [, setAuthVersion] = useState(0);

  useEffect(() => {
    const refreshAuthState = () => {
      setAuthVersion((value) => value + 1);
    };

    window.addEventListener(AUTH_CHANGED_EVENT, refreshAuthState);
    window.addEventListener("storage", refreshAuthState);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, refreshAuthState);
      window.removeEventListener("storage", refreshAuthState);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PlayerProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={getToken() ? <Home /> : <Navigate to="/about" replace />} />
                <Route path="/about" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/player" element={<Navigate to="/" replace />} />
                <Route path="/for-you" element={<AIRecommendations />} />
                <Route path="/ai-recommendations" element={<Navigate to="/for-you" replace />} />
                <Route path="/sound-studio" element={<AIGenerator />} />
                <Route path="/ai-generator" element={<Navigate to="/sound-studio" replace />} />
                <Route path="/social" element={<Social />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/test" element={<TestLab />} />
                <Route path="/admin" element={<Admin />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
