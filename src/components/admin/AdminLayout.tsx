import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "./AdminSidebar";
import { SeasonSelector } from "./SeasonSelector";
import { SeasonProvider } from "@/hooks/useSeason";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have admin privileges. Please contact the tournament administrator
            to request access.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Try Another Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SeasonProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-auto">
          <div className="flex justify-end mb-6">
            <SeasonSelector />
          </div>
          <Outlet />
        </main>
      </div>
    </SeasonProvider>
  );
}
