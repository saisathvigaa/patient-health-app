// ─── Auth ───
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Patients ───
export interface Patient {
  id: string;
  name: string;
  date_of_birth?: string;
  sex?: string;
  blood_group?: string;
  patient_id_external?: string;
  referring_doctor?: string;
  hospital?: string;
  report_count: number;
}

export interface PatientCreate {
  name: string;
  date_of_birth?: string;
  sex?: string;
  blood_group?: string;
  referring_doctor?: string;
  hospital?: string;
}

// ─── Reports ───
export interface LabValue {
  id: string;
  test_name: string;
  test_category?: string;
  value_numeric?: number;
  value_text?: string;
  unit?: string;
  ref_low?: number;
  ref_high?: number;
  flag?: string;
  note?: string;
  ocr_confidence?: number;
  user_verified: boolean;
}

export interface Report {
  id: string;
  patient_id: string;
  report_date: string;
  lab_name?: string;
  bill_id?: string;
  original_file_url?: string;
  report_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  lab_values: LabValue[];
}

export interface ReportListItem {
  id: string;
  report_date: string;
  lab_name?: string;
  status: string;
  value_count: number;
}

// ─── Trends ───
export interface TrendPoint {
  date: string;
  value?: number;
  value_text?: string;
  flag?: string;
}

export interface TrendMarker {
  test_name: string;
  unit?: string;
  ref_low?: number;
  ref_high?: number;
  data_points: TrendPoint[];
}
