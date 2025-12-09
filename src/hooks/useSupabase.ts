// src/hooks/useSupabase.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Patient,
  Treatment,
  Session,
  FeeAdjustment,
  InflationRecord,
  PatientInsert,
  PatientUpdate,
  TreatmentInsert,
  TreatmentUpdate,
  SessionInsert,
  SessionUpdate,
  InflationRecordInsert,
  FeeAdjustmentInsert,
  AppData
} from '@/types/database';

const initialData: AppData = {
  patients: [],
  treatments: [],
  sessions: [],
  feeAdjustments: [],
  inflationRecords: []
};

export function useSupabase() {
  const [data, setData] = useState<AppData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // LOAD ALL DATA
  // ============================================
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        { data: patients, error: patientsError },
        { data: treatments, error: treatmentsError },
        { data: sessions, error: sessionsError },
        { data: feeAdjustments, error: feeAdjustmentsError },
        { data: inflationRecords, error: inflationError }
      ] = await Promise.all([
        supabase.from('patients').select('*').order('name'),
        supabase.from('treatments').select('*').order('start_date', { ascending: false }),
        supabase.from('sessions').select('*').order('session_date', { ascending: false }),
        supabase.from('fee_adjustments').select('*').order('adjustment_date', { ascending: false }),
        supabase.from('inflation_records').select('*').order('month', { ascending: false })
      ]);

      if (patientsError) throw patientsError;
      if (treatmentsError) throw treatmentsError;
      if (sessionsError) throw sessionsError;
      if (feeAdjustmentsError) throw feeAdjustmentsError;
      if (inflationError) throw inflationError;

      setData({
        patients: patients || [],
        treatments: treatments || [],
        sessions: sessions || [],
        feeAdjustments: feeAdjustments || [],
        inflationRecords: inflationRecords || []
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // PATIENTS CRUD
  // ============================================

  const createPatient = async (patient: PatientInsert): Promise<Patient | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      const { data: newPatient, error } = await supabase
        .from('patients')
        .insert({ ...patient, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        patients: [...prev.patients, newPatient].sort((a, b) => a.name.localeCompare(b.name))
      }));

      return newPatient;
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err instanceof Error ? err.message : 'Error al crear paciente');
      return null;
    }
  };

  const updatePatient = async (id: string, updates: PatientUpdate): Promise<Patient | null> => {
    try {
      const { data: updatedPatient, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        patients: prev.patients
          .map(p => p.id === id ? updatedPatient : p)
          .sort((a, b) => a.name.localeCompare(b.name))
      }));

      return updatedPatient;
    } catch (err) {
      console.error('Error updating patient:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar paciente');
      return null;
    }
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        patients: prev.patients.filter(p => p.id !== id),
        treatments: prev.treatments.filter(t => t.patient_id !== id)
      }));

      return true;
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar paciente');
      return false;
    }
  };

  // ============================================
  // TREATMENTS CRUD
  // ============================================

  const createTreatment = async (treatment: TreatmentInsert): Promise<Treatment | null> => {
    try {
      const { data: newTreatment, error } = await supabase
        .from('treatments')
        .insert(treatment)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        treatments: [newTreatment, ...prev.treatments]
      }));

      return newTreatment;
    } catch (err) {
      console.error('Error creating treatment:', err);
      setError(err instanceof Error ? err.message : 'Error al crear tratamiento');
      return null;
    }
  };

  const updateTreatment = async (id: string, updates: TreatmentUpdate): Promise<Treatment | null> => {
    try {
      const { data: updatedTreatment, error } = await supabase
        .from('treatments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        treatments: prev.treatments.map(t => t.id === id ? updatedTreatment : t)
      }));

      return updatedTreatment;
    } catch (err) {
      console.error('Error updating treatment:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar tratamiento');
      return null;
    }
  };

  const deleteTreatment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('treatments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        treatments: prev.treatments.filter(t => t.id !== id),
        sessions: prev.sessions.filter(s => s.treatment_id !== id),
        feeAdjustments: prev.feeAdjustments.filter(fa => fa.treatment_id !== id)
      }));

      return true;
    } catch (err) {
      console.error('Error deleting treatment:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar tratamiento');
      return false;
    }
  };

  // ============================================
  // FEE ADJUSTMENTS
  // ============================================

  const createFeeAdjustment = async (adjustment: FeeAdjustmentInsert): Promise<FeeAdjustment | null> => {
    try {
      const { data: newAdjustment, error } = await supabase
        .from('fee_adjustments')
        .insert(adjustment)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        feeAdjustments: [newAdjustment, ...prev.feeAdjustments].sort(
          (a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()
        )
      }));

      return newAdjustment;
    } catch (err) {
      console.error('Error creating fee adjustment:', err);
      setError(err instanceof Error ? err.message : 'Error al crear ajuste de honorario');
      return null;
    }
  };

  /**
   * Aplica un ajuste de honorario a un tratamiento
   * - Actualiza el current_fee del tratamiento
   * - Crea un registro en fee_adjustments con la fecha de vigencia indicada
   */
  const applyFeeAdjustment = async (
    treatmentId: string, 
    newFee: number, 
    effectiveDate: string
  ): Promise<boolean> => {
    try {
      const currentTreatment = data.treatments.find(t => t.id === treatmentId);
      if (!currentTreatment) {
        throw new Error('Tratamiento no encontrado');
      }

      const previousFee = currentTreatment.current_fee;
      const adjustmentPercentage = ((newFee - previousFee) / previousFee) * 100;

      // 1. Actualizar el tratamiento con el nuevo honorario
      const { data: updatedTreatment, error: treatmentError } = await supabase
        .from('treatments')
        .update({ current_fee: newFee })
        .eq('id', treatmentId)
        .select()
        .single();

      if (treatmentError) throw treatmentError;

      // 2. Crear el registro de ajuste con la fecha de vigencia
      const { data: newAdjustment, error: adjustmentError } = await supabase
        .from('fee_adjustments')
        .insert({
          treatment_id: treatmentId,
          previous_fee: previousFee,
          new_fee: newFee,
          adjustment_percentage: Math.round(adjustmentPercentage * 100) / 100,
          adjustment_date: effectiveDate,
          notes: null
        })
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      // 3. Actualizar el estado local
      setData(prev => ({
        ...prev,
        treatments: prev.treatments.map(t => t.id === treatmentId ? updatedTreatment : t),
        feeAdjustments: [newAdjustment, ...prev.feeAdjustments].sort(
          (a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()
        )
      }));

      return true;
    } catch (err) {
      console.error('Error applying fee adjustment:', err);
      setError(err instanceof Error ? err.message : 'Error al aplicar ajuste de honorario');
      return false;
    }
  };

  /**
   * Actualiza un ajuste de honorario existente
   * Si es el ajuste más reciente del tratamiento, también actualiza el current_fee
   */
  const updateFeeAdjustment = async (
    adjustmentId: string,
    newFee: number,
    effectiveDate: string
  ): Promise<boolean> => {
    try {
      const currentAdjustment = data.feeAdjustments.find(fa => fa.id === adjustmentId);
      if (!currentAdjustment) {
        throw new Error('Ajuste no encontrado');
      }

      const previousFee = currentAdjustment.previous_fee;
      const adjustmentPercentage = ((newFee - previousFee) / previousFee) * 100;

      // 1. Actualizar el ajuste
      const { data: updatedAdjustment, error: adjustmentError } = await supabase
        .from('fee_adjustments')
        .update({
          new_fee: newFee,
          adjustment_date: effectiveDate,
          adjustment_percentage: Math.round(adjustmentPercentage * 100) / 100
        })
        .eq('id', adjustmentId)
        .select()
        .single();

      if (adjustmentError) throw adjustmentError;

      // 2. Verificar si es el ajuste más reciente del tratamiento
      const treatmentAdjustments = data.feeAdjustments
        .filter(fa => fa.treatment_id === currentAdjustment.treatment_id)
        .sort((a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime());

      const isLatestAdjustment = treatmentAdjustments[0]?.id === adjustmentId;

      // 3. Si es el más reciente, actualizar el current_fee del tratamiento
      let updatedTreatment = null;
      if (isLatestAdjustment) {
        const { data: treatment, error: treatmentError } = await supabase
          .from('treatments')
          .update({ current_fee: newFee })
          .eq('id', currentAdjustment.treatment_id)
          .select()
          .single();

        if (treatmentError) throw treatmentError;
        updatedTreatment = treatment;
      }

      // 4. Actualizar estado local
      setData(prev => ({
        ...prev,
        feeAdjustments: prev.feeAdjustments
          .map(fa => fa.id === adjustmentId ? updatedAdjustment : fa)
          .sort((a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime()),
        treatments: updatedTreatment 
          ? prev.treatments.map(t => t.id === currentAdjustment.treatment_id ? updatedTreatment : t)
          : prev.treatments
      }));

      return true;
    } catch (err) {
      console.error('Error updating fee adjustment:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar ajuste de honorario');
      return false;
    }
  };

  /**
   * Elimina un ajuste de honorario
   * Si es el más reciente, revierte el current_fee al ajuste anterior o al initial_fee
   */
  const deleteFeeAdjustment = async (adjustmentId: string): Promise<boolean> => {
    try {
      const currentAdjustment = data.feeAdjustments.find(fa => fa.id === adjustmentId);
      if (!currentAdjustment) {
        throw new Error('Ajuste no encontrado');
      }

      const treatmentId = currentAdjustment.treatment_id;

      // Verificar si es el ajuste más reciente
      const treatmentAdjustments = data.feeAdjustments
        .filter(fa => fa.treatment_id === treatmentId)
        .sort((a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime());

      const isLatestAdjustment = treatmentAdjustments[0]?.id === adjustmentId;

      // 1. Eliminar el ajuste
      const { error: deleteError } = await supabase
        .from('fee_adjustments')
        .delete()
        .eq('id', adjustmentId);

      if (deleteError) throw deleteError;

      // 2. Si era el más reciente, revertir el current_fee
      let updatedTreatment = null;
      if (isLatestAdjustment) {
        // Buscar el ajuste anterior o usar initial_fee
        const previousAdjustment = treatmentAdjustments[1];
        const treatment = data.treatments.find(t => t.id === treatmentId);
        const revertFee = previousAdjustment ? previousAdjustment.new_fee : treatment?.initial_fee;

        if (revertFee) {
          const { data: treatmentData, error: treatmentError } = await supabase
            .from('treatments')
            .update({ current_fee: revertFee })
            .eq('id', treatmentId)
            .select()
            .single();

          if (treatmentError) throw treatmentError;
          updatedTreatment = treatmentData;
        }
      }

      // 3. Actualizar estado local
      setData(prev => ({
        ...prev,
        feeAdjustments: prev.feeAdjustments.filter(fa => fa.id !== adjustmentId),
        treatments: updatedTreatment 
          ? prev.treatments.map(t => t.id === treatmentId ? updatedTreatment : t)
          : prev.treatments
      }));

      return true;
    } catch (err) {
      console.error('Error deleting fee adjustment:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar ajuste de honorario');
      return false;
    }
  };

  // ============================================
  // SESSIONS CRUD
  // ============================================

  const createSession = async (session: SessionInsert): Promise<Session | null> => {
    try {
      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions]
      }));

      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Error al crear sesión');
      return null;
    }
  };

  const updateSession = async (id: string, updates: SessionUpdate): Promise<Session | null> => {
    try {
      const { data: updatedSession, error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        sessions: prev.sessions.map(s => s.id === id ? updatedSession : s)
      }));

      return updatedSession;
    } catch (err) {
      console.error('Error updating session:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar sesión');
      return null;
    }
  };

  const toggleSessionPaid = async (id: string): Promise<boolean> => {
    const session = data.sessions.find(s => s.id === id);
    if (!session) return false;

    const result = await updateSession(id, { is_paid: !session.is_paid });
    return result !== null;
  };

  const deleteSession = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== id)
      }));

      return true;
    } catch (err) {
      console.error('Error deleting session:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar sesión');
      return false;
    }
  };

  // ============================================
  // INFLATION RECORDS CRUD
  // ============================================

  const createInflationRecord = async (record: InflationRecordInsert): Promise<InflationRecord | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuario no autenticado');
        return null;
      }

      const { data: newRecord, error } = await supabase
        .from('inflation_records')
        .insert({ ...record, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setData(prev => ({
        ...prev,
        inflationRecords: [newRecord, ...prev.inflationRecords].sort(
          (a, b) => new Date(b.month).getTime() - new Date(a.month).getTime()
        )
      }));

      return newRecord;
    } catch (err) {
      console.error('Error creating inflation record:', err);
      setError(err instanceof Error ? err.message : 'Error al crear registro de inflación');
      return null;
    }
  };

  const deleteInflationRecord = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('inflation_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => ({
        ...prev,
        inflationRecords: prev.inflationRecords.filter(r => r.id !== id)
      }));

      return true;
    } catch (err) {
      console.error('Error deleting inflation record:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar registro de inflación');
      return false;
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getPatientTreatments = useCallback((patientId: string): Treatment[] => {
    return data.treatments.filter(t => t.patient_id === patientId);
  }, [data.treatments]);

  const getActiveTreatment = useCallback((patientId: string): Treatment | undefined => {
    return data.treatments.find(t => t.patient_id === patientId && t.is_active);
  }, [data.treatments]);

  const getTreatmentSessions = useCallback((treatmentId: string): Session[] => {
    return data.sessions
      .filter(s => s.treatment_id === treatmentId)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());
  }, [data.sessions]);

  const getPatient = useCallback((patientId: string): Patient | undefined => {
    return data.patients.find(p => p.id === patientId);
  }, [data.patients]);

  const getTreatmentFeeAdjustments = useCallback((treatmentId: string): FeeAdjustment[] => {
    return data.feeAdjustments
      .filter(fa => fa.treatment_id === treatmentId)
      .sort((a, b) => new Date(b.adjustment_date).getTime() - new Date(a.adjustment_date).getTime());
  }, [data.feeAdjustments]);

  const getTreatment = useCallback((treatmentId: string): Treatment | undefined => {
    return data.treatments.find(t => t.id === treatmentId);
  }, [data.treatments]);

  // Obtener todas las sesiones pendientes de pago
  const getPendingSessions = useCallback(() => {
    return data.sessions
      .filter(s => !s.is_paid)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  }, [data.sessions]);

  // Obtener sesiones pendientes agrupadas por paciente
  const getPendingSessionsByPatient = useCallback(() => {
    const pending = getPendingSessions();
    const grouped: Record<string, { 
      patient: Patient; 
      sessions: Session[]; 
      total: number;
      treatment: Treatment | undefined;
    }> = {};

    pending.forEach(session => {
      const treatment = data.treatments.find(t => t.id === session.treatment_id);
      if (!treatment) return;
      
      const patient = data.patients.find(p => p.id === treatment.patient_id);
      if (!patient) return;

      if (!grouped[patient.id]) {
        grouped[patient.id] = {
          patient,
          sessions: [],
          total: 0,
          treatment
        };
      }
      grouped[patient.id].sessions.push(session);
      grouped[patient.id].total += session.fee_charged;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [getPendingSessions, data.treatments, data.patients]);

  // Obtener pacientes activos con tratamiento activo
  const getActivePatientsWithTreatment = useCallback(() => {
    return data.patients
      .filter(p => p.status === 'active')
      .map(patient => {
        const treatment = data.treatments.find(t => t.patient_id === patient.id && t.is_active);
        return { patient, treatment };
      })
      .filter(item => item.treatment !== undefined) as { patient: Patient; treatment: Treatment }[];
  }, [data.patients, data.treatments]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    data,
    loading,
    error,
    
    // Reload
    reload: loadData,
    
    // Patients
    createPatient,
    updatePatient,
    deletePatient,
    
    // Treatments
    createTreatment,
    updateTreatment,
    deleteTreatment,
    getTreatment,
    
    // Fee Adjustments
    createFeeAdjustment,
    applyFeeAdjustment,
    updateFeeAdjustment,
    deleteFeeAdjustment,
    
    // Sessions
    createSession,
    updateSession,
    deleteSession,
    toggleSessionPaid,
    
    // Inflation
    createInflationRecord,
    deleteInflationRecord,
    
    // Helpers
    getPatientTreatments,
    getActiveTreatment,
    getTreatmentSessions,
    getPatient,
    getTreatmentFeeAdjustments,
    getPendingSessions,
    getPendingSessionsByPatient,
    getActivePatientsWithTreatment
  };
}
