import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PlayerProvider } from "@/lib/player";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import AIRecommendations from "./pages/AIRecommendations";
import AIGenerator from "./pages/AIGenerator";
import TestLab from "./pages/TestLab";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PlayerProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/player" element={<Navigate to="/" replace />} />
              <Route path="/ai-recommendations" element={<AIRecommendations />} />
              <Route path="/ai-generator" element={<AIGenerator />} />
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

export default App;
