"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import type { Patient } from "@/lib/types";
import { Activity, Plus, Users, FileText, LogOut, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, checkAuth, initialized } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newSex, setNewSex] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (initialized && !user) {
      router.push("/login");
    }
    if (user) {
      loadPatients();
    }
  }, [user, initialized]);

  const loadPatients = async () => {
    try {
      const data = await api.listPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPatient({
        name: newName,
        date_of_birth: newDob || undefined,
        sex: newSex || undefined,
      });
      setNewName("");
      setNewDob("");
      setNewSex("");
      setShowAdd(false);
      loadPatients();
    } catch (err) {
      console.error(err);
    }
  };

  if (!initialized || !user) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)",
      }}>
        <div className="animate-pulse" style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        maxWidth: "1200px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "0.625rem",
            background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={20} color="white" />
          </div>
          <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>HealthTrack</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Hi, {user.name}
          </span>
          <button className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}
            onClick={() => { logout(); router.push("/"); }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }} className="page-enter">
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "2rem",
        }}>
          <div>
            <h1 style={{ marginBottom: "0.25rem" }}>
              <Users size={28} style={{ verticalAlign: "middle", marginRight: "0.5rem" }} />
              My Patients
            </h1>
            <p>Select a patient to view their health dashboard, or add a new one.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={20} /> Add Patient
          </button>
        </div>

        {/* Add Patient Modal */}
        {showAdd && (
          <div className="card" style={{ marginBottom: "1.5rem", padding: "2rem" }}>
            <h3 style={{ marginBottom: "1.25rem" }}>Add New Patient</h3>
            <form onSubmit={handleAddPatient} style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: "1rem", alignItems: "end",
            }}>
              <div>
                <label className="label">Patient Name *</label>
                <input className="input" placeholder="e.g. Lakshmanan K"
                  value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" value={newDob}
                  onChange={(e) => setNewDob(e.target.value)} />
              </div>
              <div>
                <label className="label">Sex</label>
                <select className="input" value={newSex}
                  onChange={(e) => setNewSex(e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button"
                  onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Patient Cards */}
        {loading ? (
          <div className="animate-pulse" style={{
            textAlign: "center", padding: "4rem", color: "var(--text-secondary)",
          }}>
            Loading patients...
          </div>
        ) : patients.length === 0 ? (
          <div className="card" style={{
            textAlign: "center", padding: "4rem",
          }}>
            <Users size={48} style={{ color: "var(--text-secondary)", marginBottom: "1rem" }} />
            <h3 style={{ marginBottom: "0.5rem" }}>No patients yet</h3>
            <p style={{ marginBottom: "1.5rem" }}>
              Add a patient to start uploading blood reports and tracking health trends.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={20} /> Add Your First Patient
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1rem",
          }}>
            {patients.map((patient) => (
              <div key={patient.id} className="card" style={{ cursor: "pointer" }}
                onClick={() => router.push(`/dashboard/${patient.id}`)}
              >
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ marginBottom: "0.25rem" }}>{patient.name}</h3>
                    <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                      {patient.sex && `${patient.sex}`}
                      {patient.date_of_birth && ` • Born ${patient.date_of_birth}`}
                    </p>
                    <div className="badge badge-info">
                      <FileText size={14} style={{ marginRight: "0.25rem" }} />
                      {patient.report_count} report{patient.report_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <ChevronRight size={24} style={{ color: "var(--text-secondary)" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
