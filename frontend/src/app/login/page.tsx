"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/store";
import { Activity, Mail, Lock, User, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get("tab") === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, register, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await register(email, name, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-primary)", padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            color: "var(--text-secondary)", background: "none", border: "none",
            cursor: "pointer", marginBottom: "2rem", fontSize: "1rem",
          }}
        >
          <ArrowLeft size={18} /> Back to home
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "0.875rem",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={26} color="white" />
          </div>
          <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>HealthTrack</span>
        </div>

        <h1 style={{ marginBottom: "0.5rem" }}>
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p style={{ marginBottom: "2rem" }}>
          {isRegister
            ? "Start tracking your health in under a minute."
            : "Sign in to view your health dashboard."}
        </p>

        {error && (
          <div style={{
            padding: "0.875rem 1rem", borderRadius: "0.75rem",
            background: "rgba(239, 68, 68, 0.12)", color: "var(--danger)",
            marginBottom: "1.5rem", fontSize: "0.95rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {isRegister && (
            <div>
              <label className="label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={18} style={{
                  position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }} />
                <input
                  className="input"
                  style={{ paddingLeft: "2.75rem" }}
                  type="text"
                  placeholder="e.g. Lakshmanan K"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} style={{
                position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                color: "var(--text-secondary)",
              }} />
              <input
                className="input"
                style={{ paddingLeft: "2.75rem" }}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{
                position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)",
                color: "var(--text-secondary)",
              }} />
              <input
                className="input"
                style={{ paddingLeft: "2.75rem" }}
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}
            style={{ width: "100%", marginTop: "0.5rem" }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "1rem" }}>
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{
              background: "none", border: "none", color: "var(--accent)",
              cursor: "pointer", fontWeight: 600, fontSize: "1rem",
            }}
          >
            {isRegister ? "Sign In" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)", color: "var(--text-secondary)",
      }}>
        Loading...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
