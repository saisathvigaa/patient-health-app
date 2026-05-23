import type { AuthResponse, Patient, PatientCreate, Report, ReportListItem, TrendMarker } from './types';

const API_URL = '';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Don't set Content-Type for FormData (browser will set multipart boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return null as T;
    return response.json();
  }

  // ─── Auth ───
  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string }>('/api/auth/me');
  }

  // ─── Patients ───
  async listPatients(): Promise<Patient[]> {
    return this.request<Patient[]>('/api/patients');
  }

  async createPatient(data: PatientCreate): Promise<Patient> {
    return this.request<Patient>('/api/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPatient(id: string): Promise<Patient> {
    return this.request<Patient>(`/api/patients/${id}`);
  }

  async deletePatient(id: string): Promise<void> {
    return this.request<void>(`/api/patients/${id}`, { method: 'DELETE' });
  }

  // ─── Reports ───
  async uploadReport(patientId: string, file: File, reportDate: string): Promise<Report> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_date', reportDate);
    return this.request<Report>(`/api/patients/${patientId}/reports/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  async listReports(patientId: string): Promise<ReportListItem[]> {
    return this.request<ReportListItem[]>(`/api/patients/${patientId}/reports`);
  }

  async getReport(reportId: string): Promise<Report> {
    return this.request<Report>(`/api/reports/${reportId}`);
  }

  async confirmValues(reportId: string, values: any[]): Promise<void> {
    return this.request<void>(`/api/reports/${reportId}/values`, {
      method: 'PUT',
      body: JSON.stringify(values),
    });
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.request<void>(`/api/reports/${reportId}`, { method: 'DELETE' });
  }

  // ─── Trends ───
  async getTrends(patientId: string): Promise<TrendMarker[]> {
    return this.request<TrendMarker[]>(`/api/patients/${patientId}/trends`);
  }
}

export const api = new ApiClient();
