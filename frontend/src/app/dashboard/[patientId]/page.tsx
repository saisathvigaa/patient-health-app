"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import type { Patient, ReportListItem, TrendMarker } from "@/lib/types";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  ArrowLeft, Upload, TrendingUp, FileText, Calendar,
  AlertTriangle, CheckCircle, Clock, Activity,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Colors for different markers
const CHART_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#a855f7",
];

export default function PatientDashboard() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const { user, checkAuth, initialized } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [trends, setTrends] = useState<TrendMarker[]>([]);
  const [activeTab, setActiveTab] = useState<"trends" | "reports">("trends");
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
    if (user) loadData();
  }, [user, initialized]);

  const loadData = async () => {
    try {
      const [p, r, t] = await Promise.all([
        api.getPatient(patientId),
        api.listReports(patientId),
        api.getTrends(patientId),
      ]);
      setPatient(p);
      setReports(r);
      setTrends(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (marker: TrendMarker) => {
    const labels = marker.data_points.map((dp) =>
      new Date(dp.date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
    );
    const values = marker.data_points.map((dp) => dp.value ?? null);
    const colorIndex = trends.indexOf(marker) % CHART_COLORS.length;
    const color = CHART_COLORS[colorIndex];

    return {
      labels,
      datasets: [
        {
          label: `${marker.test_name} (${marker.unit || ""})`,
          data: values,
          borderColor: color,
          backgroundColor: color + "20",
          fill: true,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointBackgroundColor: color,
          pointBorderColor: "#0a0a14",
          pointBorderWidth: 2,
        },
        // Reference range bands
        ...(marker.ref_low != null ? [{
          label: "Low Ref",
          data: Array(labels.length).fill(marker.ref_low),
          borderColor: "rgba(245, 158, 11, 0.3)",
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        }] : []),
        ...(marker.ref_high != null ? [{
          label: "High Ref",
          data: Array(labels.length).fill(marker.ref_high),
          borderColor: "rgba(239, 68, 68, 0.3)",
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        }] : []),
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#9ca3af", font: { size: 13 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#9ca3af", font: { size: 13 } },
      },
    },
  };

  if (loading || !patient) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div className="animate-pulse" style={{ color: "var(--text-secondary)" }}>Loading dashboard...</div>
      </div>
    );
  }

  // Group trends by category
  const groupedTrends: Record<string, TrendMarker[]> = {};
  trends.forEach((t) => {
    const cat = t.data_points.length > 0 ? "All Markers" : "Other";
    if (!groupedTrends[cat]) groupedTrends[cat] = [];
    groupedTrends[cat].push(t);
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        maxWidth: "1400px", margin: "0 auto",
      }}>
        <button onClick={() => router.push("/dashboard")} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "none", border: "none", color: "var(--text-secondary)",
          cursor: "pointer", fontSize: "1rem",
        }}>
          <ArrowLeft size={18} /> Back to Patients
        </button>
        <button className="btn btn-primary"
          onClick={() => router.push(`/dashboard/${patientId}/upload`)}
        >
          <Upload size={18} /> Upload Report
        </button>
      </nav>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }} className="page-enter">
        {/* Patient header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.25rem" }}>
            <Activity size={28} style={{ verticalAlign: "middle", marginRight: "0.5rem", color: "var(--accent)" }} />
            {patient.name}
          </h1>
          <p>
            {patient.sex && `${patient.sex}`}
            {patient.date_of_birth && ` • Born ${patient.date_of_birth}`}
            {patient.blood_group && ` • Blood Group: ${patient.blood_group}`}
            {` • ${reports.length} report${reports.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "0.5rem", marginBottom: "2rem",
          borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem",
        }}>
          {[
            { key: "trends" as const, label: "Trend Charts", icon: <TrendingUp size={18} /> },
            { key: "reports" as const, label: "Reports", icon: <FileText size={18} /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.25rem", borderRadius: "0.75rem",
              background: activeTab === tab.key ? "rgba(99, 102, 241, 0.12)" : "transparent",
              color: activeTab === tab.key ? "var(--accent)" : "var(--text-secondary)",
              border: "none", cursor: "pointer", fontWeight: 600, fontSize: "1rem",
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Trend Charts Tab */}
        {activeTab === "trends" && (
          <>
            {trends.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
                <TrendingUp size={48} style={{ color: "var(--text-secondary)", marginBottom: "1rem" }} />
                <h3 style={{ marginBottom: "0.5rem" }}>No data yet</h3>
                <p style={{ marginBottom: "1.5rem" }}>
                  Upload a blood report to start seeing your health trends.
                </p>
                <button className="btn btn-primary"
                  onClick={() => router.push(`/dashboard/${patientId}/upload`)}
                >
                  <Upload size={18} /> Upload First Report
                </button>
              </div>
            ) : (
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                gap: "1.5rem",
              }}>
                {trends.filter(m => m.data_points.length >= 2).map((marker, i) => (
                  <div key={i} className="card" style={{ padding: "1.5rem" }}>
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: "1rem",
                    }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", marginBottom: "0.125rem" }}>{marker.test_name}</h3>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {marker.unit}
                          {marker.ref_low != null && marker.ref_high != null &&
                            ` • Ref: ${marker.ref_low}–${marker.ref_high}`}
                        </span>
                      </div>
                      {/* Latest value badge */}
                      {marker.data_points.length > 0 && (() => {
                        const latest = marker.data_points[marker.data_points.length - 1];
                        const flag = latest.flag;
                        return (
                          <div className={`badge ${flag === "high" ? "badge-danger" : flag === "low" ? "badge-warning" : "badge-success"}`}>
                            {latest.value ?? latest.value_text}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ height: "220px" }}>
                      <Line data={buildChartData(marker)} options={chartOptions} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reports.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
                <FileText size={48} style={{ color: "var(--text-secondary)", marginBottom: "1rem" }} />
                <h3>No reports uploaded</h3>
                <p style={{ marginBottom: "1.5rem" }}>Upload your first blood report to get started.</p>
                <button className="btn btn-primary"
                  onClick={() => router.push(`/dashboard/${patientId}/upload`)}
                >
                  <Upload size={18} /> Upload Report
                </button>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="card" style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/dashboard/${patientId}?report=${report.id}`)}
                >
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "0.75rem",
                        background: "rgba(99, 102, 241, 0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Calendar size={22} style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1rem", marginBottom: "0.125rem" }}>
                          {new Date(report.report_date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </h3>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                          {report.lab_name || "Lab report"} • {report.value_count} values extracted
                        </span>
                      </div>
                    </div>
                    <div className={`badge ${
                      report.status === "completed" ? "badge-success" :
                      report.status === "processing" ? "badge-warning" :
                      report.status === "failed" ? "badge-danger" : "badge-info"
                    }`}>
                      {report.status === "completed" && <><CheckCircle size={14} /> Complete</>}
                      {report.status === "processing" && <><Clock size={14} /> Processing</>}
                      {report.status === "failed" && <><AlertTriangle size={14} /> Failed</>}
                      {report.status === "pending" && <><Clock size={14} /> Pending</>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
