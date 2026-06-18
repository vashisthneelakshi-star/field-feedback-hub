import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function formatErr(d) {
  if (d == null) return "Login failed";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map(e => e?.msg || JSON.stringify(e)).join(" ");
  return String(d);
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Login successful");
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 bg-secondary text-secondary-foreground p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-black text-xl">P</div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase opacity-70">Rajasthan Patrika</div>
              <div className="text-sm font-bold tracking-tight">Director Office</div>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.25em] uppercase opacity-60 mb-4">Visit Intelligence Platform</div>
            <h1 className="text-5xl font-black tracking-tight leading-[0.95] mb-6">
              Turn branch visits into<br />
              <span className="text-primary">data-driven decisions</span>.
            </h1>
            <p className="text-sm opacity-80 max-w-md leading-relaxed">
              Next-generation visit reporting for the Director Office &mdash; 9 segments, AI-powered insights, executive summaries and full audit trail. A McKinsey-style brief in one click.
            </p>
          </div>
        </div>
        <div className="text-[10px] tracking-widest uppercase opacity-50 font-mono">v2.0 · {new Date().getFullYear()}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-primary text-primary-foreground flex items-center justify-center font-black text-lg">P</div>
            <div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Rajasthan Patrika</div>
              <div className="text-sm font-bold">Director Office</div>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Sign In</div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in with your credentials.</p>

          <div className="space-y-5">
            <div>
              <Label className="text-[10px] uppercase tracking-wider">Email</Label>
              <Input data-testid="login-email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     className="rounded-none mt-1.5 h-11" placeholder="admin@patrika.com" required autoFocus />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider">Password</Label>
              <Input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     className="rounded-none mt-1.5 h-11" placeholder="••••••••" required />
            </div>
            <Button data-testid="login-submit-btn" type="submit" disabled={loading}
                    className="w-full rounded-none bg-primary hover:bg-primary/90 h-11 mt-2">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
          </div>

          <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold mb-2">Demo Credentials</div>
            <div>Admin: <code className="font-mono">admin@patrika.com</code> / <code className="font-mono">admin123</code></div>
          </div>
        </form>
      </div>
    </div>
  );
}
