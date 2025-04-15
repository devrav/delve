import { browserSupabase } from "@/utils/supabase/client";
import { useState } from "react";
import Layout from "./Layout";
import { Button } from "./ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await browserSupabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
      setMessage("Check your email for the login link!");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/50">
        <main className="w-full max-w-md space-y-8 rounded-xl border bg-card p-8 shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to Delve
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending login link..." : "Send Login Link"}
            </Button>

            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.includes("error")
                    ? "bg-destructive/10 text-destructive"
                    : "bg-success/10 text-success"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </main>
      </div>
    </Layout>
  );
}
