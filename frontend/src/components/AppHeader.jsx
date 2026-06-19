import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "./ui/button";
import { LogOut, Users, History, Home, Shield, LayoutDashboard } from "lucide-react";

export default function AppHeader() {
  const { user, logout, isAdmin } = useAuth();
  const loc = useLocation();
  const navItem = (to, icon, label, testid) => {
    const Icon = icon;
    const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
    return (
      <Link to={to} data-testid={testid}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "text-secondary-foreground/80 hover:text-secondary-foreground"}`}>
        <Icon className="w-3.5 h-3.5" strokeWidth={1.8} /> {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-foreground bg-secondary text-secondary-foreground no-print">
      <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">P</div>
            <div>
              <div className="text-[9px] tracking-[0.25em] uppercase opacity-70">Rajasthan Patrika</div>
              <div className="text-sm font-bold tracking-tight">Director Office · Visit Intel</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 ml-4">
            {navItem("/", Home, "Visits", "nav-visits")}
            {navItem("/dashboard", LayoutDashboard, "Dashboard", "nav-dashboard")}
            {navItem("/history", History, "History", "nav-history")}
            {isAdmin && navItem("/admin/users", Users, "Users", "nav-users")}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="text-right">
              <div className="text-xs font-semibold">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1 justify-end">
                {isAdmin && <Shield className="w-3 h-3 text-primary" />} {user.role}
              </div>
            </div>
          )}
          <Button data-testid="logout-btn" onClick={logout} variant="outline"
                  className="rounded-none border-secondary-foreground/30 bg-transparent text-secondary-foreground hover:bg-secondary-foreground/10 h-9 text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
