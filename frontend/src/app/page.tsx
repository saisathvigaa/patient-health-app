"use client";

import { useRouter } from "next/navigation";
import { Activity, Upload, Shield, TrendingUp, ChevronRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1.25rem 2rem", maxWidth: "1200px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "0.75rem",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={22} color="white" />
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>HealthTrack</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={() => router.push("/login")}>
            Sign In
          </button>
          <button className="btn btn-primary" onClick={() => router.push("/login?tab=register")}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        maxWidth: "1200px", margin: "0 auto", padding: "5rem 2rem 4rem",
        textAlign: "center",
      }}>
        <div className="badge badge-info" style={{ marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Free &amp; Secure — Your Data Stays Private
        </div>
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
          lineHeight: 1.1, maxWidth: "800px", margin: "0 auto 1.5rem",
          letterSpacing: "-0.03em",
        }}>
          Understand Your Blood Reports{" "}
          <span style={{ color: "var(--accent)" }}>At a Glance</span>
        </h1>
        <p style={{
          fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto 2.5rem",
          lineHeight: 1.7,
        }}>
          Upload your lab report PDF or photo. We&apos;ll extract the values, track trends
          over time, and show you a beautiful dashboard — just like your doctor sees.
        </p>
        <button
          className="btn btn-primary"
          style={{ fontSize: "1.1rem", padding: "1rem 2.5rem" }}
          onClick={() => router.push("/login?tab=register")}
        >
          Start Tracking — It&apos;s Free
          <ChevronRight size={20} />
        </button>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: "1200px", margin: "0 auto", padding: "2rem 2rem 5rem",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem",
      }}>
        {[
          {
            icon: <Upload size={28} />,
            title: "Upload Any Report",
            desc: "PDF or photo — we support all major Indian lab formats including Bioline, Mani Lab, and more.",
          },
          {
            icon: <TrendingUp size={28} />,
            title: "Track Trends Over Time",
            desc: "See how your Creatinine, Sodium, Haemoglobin and 30+ markers change across visits.",
          },
          {
            icon: <Shield size={28} />,
            title: "Secure & Private",
            desc: "Your medical data is encrypted and never shared. Only you and people you invite can see it.",
          },
        ].map((feature, i) => (
          <div key={i} className="card" style={{ padding: "2rem" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "1rem",
              background: "rgba(99, 102, 241, 0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--accent)", marginBottom: "1.25rem",
            }}>
              {feature.icon}
            </div>
            <h3 style={{ marginBottom: "0.75rem" }}>{feature.title}</h3>
            <p style={{ fontSize: "1rem" }}>{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "2rem",
        borderTop: "1px solid var(--border)", color: "var(--text-secondary)",
        fontSize: "0.9rem",
      }}>
        <p>Built with care for patients and families.</p>
      </footer>
    </div>
  );
}
