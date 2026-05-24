"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import type { Report, LabValue } from "@/lib/types";
import {
  ArrowLeft, CheckCircle, AlertTriangle, TrendingUp,
  TrendingDown, Minus, FlaskConical, Trash2, Check,
} from "lucide-react";

const CATEGORY_ORDER = [
  "CBC", "Blood Sugar", "Kidney Function", "Liver Function",
  "Thyroid", "Lipid Profile", "Electrolytes", "Urine", "Other",
];

function FlagBadge({ flag }: { flag?: string | null }) {
  if (!flag || flag === "N") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.2rem 0.6rem", borderRadius: "0.4rem", fontSize: "0.78rem",
      fontWeight: 600, background: "rgba(34,197,94,0.12)", color: "var(--success)",
    }}>
      <Minus size={12} /> Normal
    </span>
  );
  if (flag === "H") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.2rem 0.6rem", borderRadius: "0.4rem", fontSize: "0.78rem",
      fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "var(--danger)",
    }}>
      <TrendingUp size={12} /> High
    </span>
  );
  if (flag === "L") return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      padding: "0.2rem 0.6rem", borderRadius: "0.4rem", fontSize: "0.78rem",
      fontWeight: 600, background: "rgba(245,158,11,0.12)", color: "var(--warning)",
    }}>
      <TrendingDown size={12} /> Low
    </span>
  );
  return null;
}

function ValueBar({ value, low, high }: { value?: number | null; low?: number | null; high?: number | null }) {
  if (value == null || low == null || high == null || high <= low) return null;
  const range = high - low;
  const pct = Math.max(0, Math.min(100, ((value - low) / range) * 100));
  const isOut = value < low || value > high;
  return (
    <div style={{ marginTop: "0.4rem", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", position: "relative" }}>
      <div style={{
        position: "absolute", left: "10%", right: "10%", top: 0, bottom: 0,
        background: "rgba(34,197,94,0.2)", borderRadius: "3px",
      }} />
      <div style={{
        position: "absolute", left: `${Math.max(2, pct)}%`, top: "-3px",
        width: "12px", height: "12px", borderRadius: "50%", transform: "translateX(-50%)",
        background: isOut ? "var(--danger)" : "var(--success)",
        border: "2px solid var(--bg-secondary)",
      }} />
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const reportId = params.reportId as string;
  const { user, checkAuth, initialized } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [flagFilter, setFlagFilter] = useState<"all" | "H" | "L">("all");

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (user) loadReport();
  }, [user, initialized]);

  const loadReport = async () => {
    try {
      const r = await api.getReport(reportId);
      setReport(r);
    } catch {
      router.push(`/dashboard/${patientId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this report and all its values?")) return;
    setDeleting(true);
    try {
      await api.deleteReport(reportId);
      router.push(`/dashboard/${patientId}`);
    } catch {
      setDeleting(false);
    }
  };

  if (loading || !report) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="animate-pulse" style={{ color: "var(--text-secondary)" }}>Loading report...</div>
      </div>
    );
  }

  const grouped: Record<string, LabValue[]> = {};
  const filtered = flagFilter === "all"
    ? report.lab_values
    : report.lab_values.filter((lv) => lv.flag === flagFilter);

  filtered.forEach((lv) => {
    const cat = lv.test_category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(lv);
  });

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const abnormalCount = report.lab_values.filter((lv) => lv.flag === "H" || lv.flag === "L").length;
  const highCount = report.lab_values.filter((lv) => lv.flag === "H").length;
  const lowCount = report.lab_values.filter((lv) => lv.flag === "L").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        maxWidth: "1100px", margin: "0 auto",
      }}>
        <button onClick={() => router.push(`/dashboard/${patientId}`)} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1rem",
        }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <button onClick={handleDelete} disabled={deleting} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "var(--danger)", padding: "0.5rem 1rem", borderRadius: "0.625rem",
          cursor: "pointer", fontSize: "0.9rem",
        }}>
          <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete Report"}
        </button>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }} className="page-enter">
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.4rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FlaskConical size={22} style={{ color: "var(--accent)" }} />
                {report.lab_name || "Lab Report"}
              </h1>
              <p style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>
                {report.report_type} •{" "}
                {new Date(report.report_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                {report.bill_id && ` • Bill: ${report.bill_id}`}
              </p>
              <span className="badge badge-success">
                <Check size={12} /> {report.lab_values.length} values extracted
              </span>
            </div>
            <div style={{ display: "flex", gap: "1rem" }}>
              {abnormalCount > 0 ? (
                <>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--danger)", lineHeight: 1 }}>{highCount}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>High</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--warning)", lineHeight: 1 }}>{lowCount}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Low</div>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)" }}>
                  <CheckCircle size={20} />
                  <span style={{ fontWeight: 600 }}>All values normal</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {report.lab_values.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {(["all", "H", "L"] as const).map((f) => (
              <button key={f} onClick={() => setFlagFilter(f)} style={{
                padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.9rem",
                fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)",
                background: flagFilter === f ? "var(--accent)" : "var(--bg-secondary)",
                color: flagFilter === f ? "white" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}>
                {f === "all" ? `All (${report.lab_values.length})` : f === "H" ? `High (${highCount})` : `Low (${lowCount})`}
              </button>
            ))}
          </div>
        )}

        {report.lab_values.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <AlertTriangle size={40} style={{ color: "var(--warning)", marginBottom: "1rem" }} />
            <h3 style={{ marginBottom: "0.5rem" }}>No values extracted</h3>
            <p>The AI could not extract values. This can happen with handwritten reports or poor image quality.</p>
          </div>
        )}

        {sortedCategories.map((category) => (
          <div key={category} style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              {category}
            </h2>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Test", "Result", "Unit", "Reference Range", "Status"].map((h) => (
                      <th key={h} style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {grouped[category].map((lv, i) => {
                    const isAbnormal = lv.flag === "H" || lv.flag === "L";
                    return (
                      <tr key={lv.id} style={{
                        borderBottom: i < grouped[category].length - 1 ? "1px solid var(--border)" : "none",
                        background: isAbnormal ? (lv.flag === "H" ? "rgba(239,68,68,0.04)" : "rgba(245,158,11,0.04)") : "transparent",
                      }}>
                        <td style={{ padding: "1rem 1.25rem", fontWeight: 600, fontSize: "0.95rem" }}>{lv.test_name}</td>
                        <td style={{ padding: "1rem 1.25rem", fontWeight: 700, fontSize: "1.05rem", color: lv.flag === "H" ? "var(--danger)" : lv.flag === "L" ? "var(--warning)" : "var(--text-primary)" }}>
                          {lv.value_numeric != null ? lv.value_numeric : (lv.value_text || "—")}
                          {lv.value_numeric != null && <ValueBar value={lv.value_numeric} low={lv.ref_low} high={lv.ref_high} />}
                        </td>
                        <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>{lv.unit || "—"}</td>
                        <td style={{ padding: "1rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                          {lv.ref_low != null && lv.ref_high != null ? `${lv.ref_low} – ${lv.ref_high}` : lv.ref_low != null ? `\u2265 ${lv.ref_low}` : lv.ref_high != null ? `\u2264 ${lv.ref_high}` : "—"}
                        </td>
                        <td style={{ padding: "1rem 1.25rem" }}><FlagBadge flag={lv.flag} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
