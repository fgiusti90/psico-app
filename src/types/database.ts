// src/types/database.ts

export type PatientStatus = 'active' | 'inactive';

export type SessionType = 'session' | 'parent_orientation' | 'parent_interview';

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  session: 'Sesión',
  parent_orientation: 'Orientación a padres',
  parent_interview: 'Entrevista a padres'
};

// ============================================
// Database Row Types (lo que viene de Supabase)
// ============================================

export interface Patient {
  id: string;
  name: string;
  contact: string | null;
  father_name: string | null;
  mother_name: string | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  patient_id: string;
  start_date: string;
  end_date: string | null;
  initial_fee: number;
  current_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  treatment_id: string;
  session_date: string;
  session_type: SessionType;
  fee_charged: number;
  is_paid: boolean;
  created_at: string;
}

export interface FeeAdjustment {
  id: string;
  treatment_id: string;
  previous_fee: number;
  new_fee: number;
  adjustment_percentage: number;
  adjustment_date: string;
  notes: string | null;
  created_at: string;
}

export interface InflationRecord {
  id: string;
  month: string; // Formato: YYYY-MM-DD (primer día del mes)
  percentage: number;
  created_at: string;
}

// ============================================
// Insert Types (para crear nuevos registros)
// ============================================

export interface PatientInsert {
  name: string;
  contact?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  status?: PatientStatus;
}

export interface TreatmentInsert {
  patient_id: string;
  start_date: string;
  end_date?: string | null;
  initial_fee: number;
  current_fee: number;
  is_active?: boolean;
}

export interface SessionInsert {
  treatment_id: string;
  session_date: string;
  session_type: SessionType;
  fee_charged: number;
  is_paid?: boolean;
}

export interface FeeAdjustmentInsert {
  treatment_id: string;
  previous_fee: number;
  new_fee: number;
  adjustment_percentage: number;
  adjustment_date: string;
  notes?: string | null;
}

export interface InflationRecordInsert {
  month: string;
  percentage: number;
}

// ============================================
// Update Types (para actualizar registros)
// ============================================

export interface PatientUpdate {
  name?: string;
  contact?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  status?: PatientStatus;
}

export interface TreatmentUpdate {
  start_date?: string;
  end_date?: string | null;
  initial_fee?: number;
  current_fee?: number;
  is_active?: boolean;
}

export interface SessionUpdate {
  session_date?: string;
  session_type?: SessionType;
  fee_charged?: number;
  is_paid?: boolean;
}

export interface InflationRecordUpdate {
  month?: string;
  percentage?: number;
}

// ============================================
// Computed/View Types
// ============================================

export interface PatientWithTreatment extends Patient {
  active_treatment?: Treatment | null;
  total_sessions?: number;
  unpaid_sessions?: number;
}

export interface MonthlyMetrics {
  month: string;
  total_sessions: number;
  paid_sessions: number;
  total_billed: number;
  average_fee: number;
}

export interface PatientMetrics {
  patient_id: string;
  patient_name: string;
  total_sessions: number;
  paid_sessions: number;
  total_billed: number;
}

export interface InflationWithAccumulated extends InflationRecord {
  accumulated: number;
}

export interface FeeAdjustmentSuggestion {
  treatment_id: string;
  patient_id: string;
  patient_name: string;
  current_fee: number;
  last_adjustment_date: string;
  accumulated_inflation: number;
  suggested_fee: number;
  suggested_percentage: number;
}

// ============================================
// App State
// ============================================

export interface AppData {
  patients: Patient[];
  treatments: Treatment[];
  sessions: Session[];
  feeAdjustments: FeeAdjustment[];
  inflationRecords: InflationRecord[];
}

export interface ModalState {
  type: 'patient' | 'treatment' | 'session' | 'inflation' | null;
  data?: Record<string, unknown> | null;
}