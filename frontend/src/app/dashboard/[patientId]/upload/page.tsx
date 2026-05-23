"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { api } from "@/lib/api";
import {
  ArrowLeft, Upload, FileText, Image, Check, AlertCircle,
  Loader, Calendar, X,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus("uploading");
    setError("");

    try {
      setStatus("processing");
      const report = await api.uploadReport(patientId, file, reportDate);
      setStatus("done");
      // Wait a moment then redirect to dashboard
      setTimeout(() => {
        router.push(`/dashboard/${patientId}`);
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Top bar */}
      <nav style={{
        display: "flex", alignItems: "center", padding: "1rem 2rem",
        borderBottom: "1px solid var(--border)", maxWidth: "800px", margin: "0 auto",
      }}>
        <button onClick={() => router.push(`/dashboard/${patientId}`)} style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "none", border: "none", color: "var(--text-secondary)",
          cursor: "pointer", fontSize: "1rem",
        }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </nav>

      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "2.5rem 2rem" }} className="page-enter">
        <h1 style={{ marginBottom: "0.5rem" }}>
          <Upload size={28} style={{ verticalAlign: "middle", marginRight: "0.5rem", color: "var(--accent)" }} />
          Upload Lab Report
        </h1>
        <p style={{ marginBottom: "2rem" }}>
          Upload a PDF or photo of a blood report. We&apos;ll extract the values
          automatically and add them to the dashboard.
        </p>

        {/* Report Date */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label">
            <Calendar size={14} style={{ verticalAlign: "middle", marginRight: "0.25rem" }} />
            Report Date
          </label>
          <input
            className="input"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            style={{ maxWidth: "250px" }}
          />
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
          style={{ marginBottom: "1.5rem" }}
        >
          <input {...getInputProps()} />
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <div style={{
                width: 48, height: 48, borderRadius: "0.75rem",
                background: "rgba(34, 197, 94, 0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {file.type === "application/pdf"
                  ? <FileText size={24} style={{ color: "var(--success)" }} />
                  : <Image size={24} style={{ color: "var(--success)" }} />
                }
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1rem", marginBottom: "0.125rem" }}>
                  {file.name}
                </p>
                <p style={{ fontSize: "0.9rem" }}>{formatFileSize(file.size)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{
                background: "rgba(239, 68, 68, 0.12)", border: "none",
                borderRadius: "0.5rem", padding: "0.5rem", cursor: "pointer",
                color: "var(--danger)",
              }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={40} style={{ color: "var(--text-secondary)", marginBottom: "1rem" }} />
              <p style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                {isDragActive ? "Drop your file here" : "Drag & drop your report here"}
              </p>
              <p style={{ fontSize: "0.95rem" }}>
                or <span style={{ color: "var(--accent)", fontWeight: 600 }}>click to browse</span>
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: "0.75rem", color: "var(--text-secondary)" }}>
                Supports PDF, JPG, PNG • Max 20MB
              </p>
            </>
          )}
        </div>

        {/* Status Messages */}
        {status === "processing" && (
          <div className="card" style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "1rem 1.25rem", marginBottom: "1.5rem",
            borderColor: "var(--accent)",
          }}>
            <Loader size={20} style={{ color: "var(--accent)" }} className="animate-pulse" />
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              Processing... extracting lab values from your report
            </span>
          </div>
        )}

        {status === "done" && (
          <div className="card" style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "1rem 1.25rem", marginBottom: "1.5rem",
            borderColor: "var(--success)", background: "rgba(34, 197, 94, 0.06)",
          }}>
            <Check size={20} style={{ color: "var(--success)" }} />
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              Report uploaded successfully! Redirecting to dashboard...
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="card" style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "1rem 1.25rem", marginBottom: "1.5rem",
            borderColor: "var(--danger)", background: "rgba(239, 68, 68, 0.06)",
          }}>
            <AlertCircle size={20} style={{ color: "var(--danger)" }} />
            <span style={{ color: "var(--danger)" }}>{error}</span>
          </div>
        )}

        {/* Upload Button */}
        <button
          className="btn btn-primary"
          style={{ width: "100%", fontSize: "1.1rem", padding: "1rem" }}
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? (
            <><Loader size={20} className="animate-pulse" /> Processing...</>
          ) : (
            <><Upload size={20} /> Upload &amp; Extract Values</>
          )}
        </button>

        {/* Help text */}
        <div style={{
          marginTop: "2rem", padding: "1.25rem", borderRadius: "1rem",
          background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.15)",
        }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--accent)" }}>
            💡 Tips for best results
          </h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              "Use the original PDF from your lab for best accuracy",
              "If using a photo, ensure the text is clear and well-lit",
              "You can always edit extracted values after processing",
              "Supported labs: Bioline, Mani Lab, and most Indian lab formats",
            ].map((tip, i) => (
              <li key={i} style={{ display: "flex", gap: "0.5rem", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                <Check size={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: "0.2rem" }} />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
