// src/components/PsicoApp.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from './ui/Modal';
import { PatientForm } from './forms/PatientForm';
import { TreatmentForm } from './forms/TreatmentForm';
import { SessionForm } from './forms/SessionForm';
import { InflationForm } from './forms/InflationForm';
import { FeeAdjustmentForm } from './forms/FeeAdjustmentForm';
import { QuickSessionForm } from './forms/QuickSessionForm';
import {
  PatientsTab,
  SessionsTab,
  MetricsTab,
  FeesTab,
  PendingTab,
  InflationTab
} from './tabs';
import type {
  Patient,
  Treatment,
  Session,
  FeeAdjustment,
  PatientInsert,
  TreatmentInsert,
  SessionInsert,
  InflationRecordInsert
} from '@/types/database';

// ============================================
// TYPES
// ============================================

type TabType = 'patients' | 'sessions' | 'metrics' | 'fees' | 'pending' | 'inflation';

type ModalType = 'patient' | 'treatment' | 'session' | 'inflation' | 'fee_adjustment' | 'quick_session' | 'edit_session' | null;

interface ModalState {
  type: ModalType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PsicoApp() {
  const {
    data,
    loading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
    createTreatment,
    updateTreatment,
    createSession,
    updateSession,
    deleteSession,
    toggleSessionPaid,
    createInflationRecord,
    deleteInflationRecord,
    applyFeeAdjustment,
    updateFeeAdjustment,
    deleteFeeAdjustment,
    getPatientTreatments,
    getActiveTreatment,
    getTreatmentSessions,
    getPatient,
    getTreatmentFeeAdjustments,
    getTreatment,
    getPendingSessionsByPatient,
    getActivePatientsWithTreatment
  } = useSupabase();

  const { profile, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('patients');
  const [modal, setModal] = useState<ModalState>({ type: null, data: null });
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const activePatients = useMemo(() =>
    data.patients.filter(p => p.status === 'active'),
    [data.patients]
  );

  const activePatientsWithTreatment = useMemo(() =>
    getActivePatientsWithTreatment(),
    [getActivePatientsWithTreatment]
  );

  const pendingData = useMemo(() =>
    getPendingSessionsByPatient(),
    [getPendingSessionsByPatient]
  );

  const totalPending = useMemo(() =>
    pendingData.reduce((sum, p) => sum + p.total, 0),
    [pendingData]
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthSessions = data.sessions.filter(s => s.session_date.startsWith(currentMonth));
  const currentMonthStats = {
    total: currentMonthSessions.length,
    worked: currentMonthSessions.reduce((sum, s) => sum + s.fee_charged, 0),
    collected: currentMonthSessions.filter(s => s.is_paid).reduce((sum, s) => sum + s.fee_charged, 0)
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const calculateSuggestedFee = (treatment: Treatment, adjustments: FeeAdjustment[]) => {
    const lastAdjustmentDate = adjustments[0]?.adjustment_date || treatment.start_date;
    const accInf = data.inflationRecords
      .filter(ir => new Date(ir.month) >= new Date(lastAdjustmentDate))
      .reduce((sum, ir) => sum + ir.percentage, 0);
    return Math.round(treatment.current_fee * (1 + accInf / 100));
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSavePatient = async (patientData: PatientInsert & { id?: string }) => {
    if (patientData.id) {
      await updatePatient(patientData.id, patientData);
    } else {
      await createPatient(patientData);
    }
    setModal({ type: null });
  };

  const handleDeletePatient = async (patientId: string) => {
    if (window.confirm('¿Eliminar este paciente y todos sus datos?')) {
      await deletePatient(patientId);
    }
  };

  const handleSaveTreatment = async (treatmentData: TreatmentInsert & { id?: string }) => {
    if (treatmentData.id) {
      await updateTreatment(treatmentData.id, treatmentData);
    } else {
      await createTreatment(treatmentData);
    }
    setModal({ type: null });
  };

  const handleSaveSession = async (sessionData: SessionInsert & { id?: string }) => {
    if (sessionData.id) {
      await updateSession(sessionData.id, sessionData);
    } else {
      await createSession(sessionData);
    }
    setModal({ type: null });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('¿Eliminar esta prestación?')) {
      await deleteSession(sessionId);
      setModal({ type: null });
    }
  };

  const handleSaveInflation = async (inflationData: InflationRecordInsert & { id?: string }) => {
    await createInflationRecord(inflationData);
    setModal({ type: null });
  };

  const handleSaveFeeAdjustment = async (adjustmentData: {
    treatmentId: string;
    newFee: number;
    effectiveDate: string;
    adjustmentId?: string;
  }) => {
    if (adjustmentData.adjustmentId) {
      await updateFeeAdjustment(adjustmentData.adjustmentId, adjustmentData.newFee, adjustmentData.effectiveDate);
    } else {
      await applyFeeAdjustment(adjustmentData.treatmentId, adjustmentData.newFee, adjustmentData.effectiveDate);
    }
    setModal({ type: null });
  };

  const handleDeleteFeeAdjustment = async (adjustmentId: string) => {
    await deleteFeeAdjustment(adjustmentId);
    setModal({ type: null });
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-stone-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center text-red-600">
          <p className="text-xl mb-2">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; shortLabel: string }[] = [
    { id: 'patients', label: 'Pacientes', shortLabel: 'Pacientes' },
    { id: 'sessions', label: 'Prestaciones', shortLabel: 'Prestac.' },
    { id: 'metrics', label: 'Métricas', shortLabel: 'Métricas' },
    { id: 'fees', label: 'Honorarios', shortLabel: 'Honor.' },
    { id: 'pending', label: 'Pendientes', shortLabel: 'Pend.' },
    { id: 'inflation', label: 'Inflación', shortLabel: 'Inflac.' }
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-teal-600 tracking-tight">PsicoApp</h1>

          <div className="flex items-center gap-2">
            {pendingData.length > 0 && (
              <span className="sm:hidden bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {pendingData.reduce((sum, p) => sum + p.sessions.length, 0)} pend.
              </span>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <span className="hidden sm:block text-sm text-stone-600 max-w-32 truncate">
                  {profile?.full_name || 'Usuario'}
                </span>
                <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-800 truncate">{profile?.full_name}</p>
                      {profile?.license_number && (
                        <p className="text-xs text-stone-500">Mat. {profile.license_number}</p>
                      )}
                    </div>
                    <a
                      href="/perfil"
                      onClick={() => setShowUserMenu(false)}
                      className="block w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Mi perfil
                    </a>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOut();
                        window.location.href = '/login';
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-teal-50 text-teal-600' 
                  : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.id === 'pending' && pendingData.length > 0 && (
                <span className="ml-1 sm:ml-1.5 bg-red-500 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                  {pendingData.reduce((sum, p) => sum + p.sessions.length, 0)}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
          {activeTab === 'patients' && (
            <PatientsTab
              patients={data.patients}
              activePatients={activePatients}
              currentMonthStats={currentMonthStats}
              getPatientTreatments={getPatientTreatments}
              getActiveTreatment={getActiveTreatment}
              getTreatmentSessions={getTreatmentSessions}
              getTreatmentFeeAdjustments={getTreatmentFeeAdjustments}
              toggleSessionPaid={toggleSessionPaid}
              calculateSuggestedFee={calculateSuggestedFee}
              onNewPatient={() => setModal({ type: 'patient' })}
              onEditPatient={(patient) => setModal({ type: 'patient', data: patient })}
              onDeletePatient={handleDeletePatient}
              onNewTreatment={(patientId) => setModal({ type: 'treatment', data: { patient_id: patientId } })}
              onEditTreatment={(treatment) => setModal({ type: 'treatment', data: treatment })}
              onNewSession={(treatmentId, currentFee) => setModal({ type: 'session', data: { treatment_id: treatmentId, currentFee } })}
              onEditSession={(session, treatment) => setModal({ type: 'edit_session', data: { session, treatment } })}
              onNewFeeAdjustment={(data) => setModal({ type: 'fee_adjustment', data })}
            />
          )}

          {activeTab === 'sessions' && (
            <SessionsTab
              sessions={data.sessions}
              patients={data.patients}
              getTreatment={getTreatment}
              getPatient={getPatient}
              toggleSessionPaid={toggleSessionPaid}
              onNewSession={() => setModal({ type: 'quick_session' })}
              onEditSession={(session, treatment) => setModal({ type: 'edit_session', data: { session, treatment } })}
              onDeleteSession={handleDeleteSession}
            />
          )}

          {activeTab === 'metrics' && (
            <MetricsTab
              sessions={data.sessions}
              treatments={data.treatments}
              patients={data.patients}
            />
          )}

          {activeTab === 'fees' && (
            <FeesTab
              treatments={data.treatments}
              inflationRecords={data.inflationRecords}
              getPatient={getPatient}
              getTreatmentFeeAdjustments={getTreatmentFeeAdjustments}
              onNewFeeAdjustment={(data) => setModal({ type: 'fee_adjustment', data })}
            />
          )}

          {activeTab === 'pending' && (
            <PendingTab
              pendingData={pendingData}
              totalPending={totalPending}
              toggleSessionPaid={toggleSessionPaid}
            />
          )}

          {activeTab === 'inflation' && (
            <InflationTab
              inflationRecords={data.inflationRecords}
              onNewInflation={() => setModal({ type: 'inflation' })}
              onDeleteInflation={deleteInflationRecord}
            />
          )}
        </div>
      </main>

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}
      <Modal
        isOpen={modal.type === 'patient'}
        onClose={() => setModal({ type: null })}
        title={modal.data && 'id' in (modal.data as object) ? 'Editar Paciente' : 'Nuevo Paciente'}
      >
        <PatientForm
          patient={modal.data as Patient | null}
          onSave={handleSavePatient}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>

      <Modal
        isOpen={modal.type === 'treatment'}
        onClose={() => setModal({ type: null })}
        title={modal.data && 'id' in (modal.data as object) ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
      >
        <TreatmentForm
          treatment={modal.data && 'id' in (modal.data as object) ? modal.data as Treatment : null}
          patientId={(modal.data as { patient_id?: string })?.patient_id || ''}
          onSave={handleSaveTreatment}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>

      <Modal
        isOpen={modal.type === 'session'}
        onClose={() => setModal({ type: null })}
        title="Registrar Sesión"
      >
        <SessionForm
          treatmentId={(modal.data as { treatment_id?: string })?.treatment_id || ''}
          currentFee={(modal.data as { currentFee?: number })?.currentFee || 0}
          onSave={handleSaveSession}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>

      <Modal
        isOpen={modal.type === 'edit_session'}
        onClose={() => setModal({ type: null })}
        title="Editar Prestación"
      >
        {modal.data && (modal.data as { session?: Session }).session && (
          <SessionForm
            treatmentId={(modal.data as { session: Session }).session.treatment_id}
            currentFee={(modal.data as { treatment?: Treatment }).treatment?.current_fee || 0}
            session={(modal.data as { session: Session }).session}
            onSave={handleSaveSession}
            onDelete={handleDeleteSession}
            onCancel={() => setModal({ type: null })}
          />
        )}
      </Modal>

      <Modal
        isOpen={modal.type === 'quick_session'}
        onClose={() => setModal({ type: null })}
        title="Nueva Prestación"
      >
        <QuickSessionForm
          patientsWithTreatment={activePatientsWithTreatment}
          onSave={handleSaveSession}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>

      <Modal
        isOpen={modal.type === 'inflation'}
        onClose={() => setModal({ type: null })}
        title="Registrar Inflación Mensual"
      >
        <InflationForm
          onSave={handleSaveInflation}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>

      <Modal
        isOpen={modal.type === 'fee_adjustment'}
        onClose={() => setModal({ type: null })}
        title={(modal.data as { adjustment?: FeeAdjustment })?.adjustment ? 'Editar Ajuste' : 'Nuevo Ajuste'}
      >
        <FeeAdjustmentForm
          treatmentId={(modal.data as { treatmentId?: string })?.treatmentId || ''}
          patientName={(modal.data as { patientName?: string })?.patientName || ''}
          currentFee={(modal.data as { currentFee?: number })?.currentFee || 0}
          previousFee={(modal.data as { previousFee?: number })?.previousFee || 0}
          suggestedFee={(modal.data as { suggestedFee?: number })?.suggestedFee}
          adjustment={(modal.data as { adjustment?: FeeAdjustment })?.adjustment}
          onSave={handleSaveFeeAdjustment}
          onDelete={handleDeleteFeeAdjustment}
          onCancel={() => setModal({ type: null })}
        />
      </Modal>
    </div>
  );
}