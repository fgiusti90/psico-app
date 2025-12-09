// src/components/tabs/PatientsTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { StatCard } from '@/components/ui';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/lib/utils';
import { SESSION_TYPE_LABELS } from '@/types/database';
import type { Patient, Treatment, Session, FeeAdjustment } from '@/types/database';

interface PatientsTabProps {
  patients: Patient[];
  activePatients: Patient[];
  currentMonthStats: {
    total: number;
    worked: number;
    collected: number;
  };
  getPatientTreatments: (patientId: string) => Treatment[];
  getActiveTreatment: (patientId: string) => Treatment | undefined;
  getTreatmentSessions: (treatmentId: string) => Session[];
  getTreatmentFeeAdjustments: (treatmentId: string) => FeeAdjustment[];
  toggleSessionPaid: (id: string) => Promise<boolean>;
  calculateSuggestedFee: (treatment: Treatment, adjustments: FeeAdjustment[]) => number;
  onNewPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onNewTreatment: (patientId: string) => void;
  onEditTreatment: (treatment: Treatment) => void;
  onNewSession: (treatmentId: string, currentFee: number) => void;
  onEditSession: (session: Session, treatment: Treatment) => void;
  onNewFeeAdjustment: (data: {
    treatmentId: string;
    patientName: string;
    currentFee: number;
    previousFee: number;
    suggestedFee?: number;
    adjustment?: FeeAdjustment;
  }) => void;
}

export function PatientsTab({
  patients,
  activePatients,
  currentMonthStats,
  getPatientTreatments,
  getActiveTreatment,
  getTreatmentSessions,
  getTreatmentFeeAdjustments,
  toggleSessionPaid,
  calculateSuggestedFee,
  onNewPatient,
  onEditPatient,
  onDeletePatient,
  onNewTreatment,
  onEditTreatment,
  onNewSession,
  onEditSession,
  onNewFeeAdjustment
}: PatientsTabProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!patient.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (statusFilter !== 'all' && patient.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [patients, searchQuery, statusFilter]);

  // List View
  if (!selectedPatient) {
    return (
      <>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Pacientes</h2>
          <button
            onClick={onNewPatient}
            className="px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            + Nuevo paciente
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <StatCard label="Pacientes activos" value={activePatients.length} icon="👤" />
          <StatCard label="Prestaciones del mes" value={currentMonthStats.total} icon="📅" />
          <StatCard label="Trabajado del mes" value={formatCurrencyShort(currentMonthStats.worked)} icon="💼" />
          <StatCard label="Cobrado del mes" value={formatCurrencyShort(currentMonthStats.collected)} icon="💰" />
        </div>

        {/* Filtros */}
        <div className="bg-stone-50 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  ×
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {filteredPatients.map(patient => {
            const treatment = getActiveTreatment(patient.id);
            const sessions = treatment ? getTreatmentSessions(treatment.id) : [];
            const unpaid = sessions.filter(s => !s.is_paid).length;

            return (
              <div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className="p-3 sm:p-4 border border-stone-200 rounded-xl cursor-pointer hover:border-teal-300 transition-colors"
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-semibold text-sm sm:text-base">{patient.name}</span>
                  <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    patient.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm text-stone-500">
                  {treatment ? (
                    <>
                      <span>{formatCurrency(treatment.current_fee)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{sessions.length} sesiones</span>
                      {unpaid > 0 && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-red-600">{unpaid} sin cobrar</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-stone-400">Sin tratamiento activo</span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <p className="text-center text-stone-400 py-10">
              {searchQuery || statusFilter !== 'all' 
                ? 'No se encontraron pacientes con esos filtros'
                : 'No hay pacientes registrados'}
            </p>
          )}
        </div>
      </>
    );
  }

  // Detail View
  return (
    <>
      <button
        onClick={() => setSelectedPatient(null)}
        className="text-teal-600 text-sm mb-3 sm:mb-4 hover:underline"
      >
        ← Volver
      </button>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-stone-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1">{selectedPatient.name}</h2>
          <p className="text-stone-500 text-sm sm:text-base">{selectedPatient.contact}</p>
          {selectedPatient.father_name && (
            <p className="text-xs sm:text-sm text-stone-400">Padre: {selectedPatient.father_name}</p>
          )}
          {selectedPatient.mother_name && (
            <p className="text-xs sm:text-sm text-stone-400">Madre: {selectedPatient.mother_name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEditPatient(selectedPatient)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50"
          >
            Editar
          </button>
          <button
            onClick={() => {
              onDeletePatient(selectedPatient.id);
              setSelectedPatient(null);
            }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Treatments */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h3 className="font-semibold text-stone-700">Tratamientos</h3>
          <button
            onClick={() => onNewTreatment(selectedPatient.id)}
            className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-md text-xs sm:text-sm font-medium hover:bg-teal-100"
          >
            + Nuevo
          </button>
        </div>

        {getPatientTreatments(selectedPatient.id).map(treatment => {
          const sessions = getTreatmentSessions(treatment.id);
          const adjustments = getTreatmentFeeAdjustments(treatment.id);
          const suggestedFee = calculateSuggestedFee(treatment, adjustments);

          return (
            <div key={treatment.id} className="bg-stone-50 rounded-xl p-3 sm:p-4 mb-3">
              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                  treatment.is_active 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-stone-200 text-stone-600'
                }`}>
                  {treatment.is_active ? 'Activo' : 'Finalizado'}
                </span>
                <button
                  onClick={() => onEditTreatment(treatment)}
                  className="text-teal-600 text-xs sm:text-sm hover:underline"
                >
                  Editar
                </button>
              </div>

              <div className="text-xs sm:text-sm text-stone-600 space-y-2 mb-4">
                <div>
                  <span className="text-stone-400">Inicio:</span> {formatDate(treatment.start_date)}
                  {treatment.end_date && (
                    <> — <span className="text-stone-400">Fin:</span> {formatDate(treatment.end_date)}</>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span>
                    <span className="text-stone-400">Inicial:</span> {formatCurrency(treatment.initial_fee)}
                    {' → '}
                    <span className="text-stone-400">Actual:</span> {formatCurrency(treatment.current_fee)}
                  </span>
                  {treatment.is_active && (
                    <button
                      onClick={() => onNewFeeAdjustment({
                        treatmentId: treatment.id,
                        patientName: selectedPatient.name,
                        currentFee: treatment.current_fee,
                        previousFee: treatment.current_fee,
                        suggestedFee: suggestedFee
                      })}
                      className="px-2 py-1 bg-teal-50 text-teal-600 rounded text-xs font-medium hover:bg-teal-100 w-fit"
                    >
                      Ajustar honorario
                    </button>
                  )}
                </div>
              </div>

              {/* Historial de ajustes */}
              {adjustments.length > 0 && (
                <div className="mb-4 p-2 sm:p-3 bg-white rounded-lg">
                  <h5 className="text-xs font-semibold text-stone-500 uppercase mb-2">Historial de Ajustes</h5>
                  <div className="space-y-1">
                    {adjustments.map(adj => (
                      <div key={adj.id} className="flex flex-col sm:flex-row sm:justify-between text-xs text-stone-600 gap-1">
                        <span>{formatDate(adj.adjustment_date)}</span>
                        <div className="flex items-center gap-2">
                          <span>
                            {formatCurrency(adj.previous_fee)} → {formatCurrency(adj.new_fee)}
                            <span className={`ml-1 sm:ml-2 ${adj.adjustment_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({adj.adjustment_percentage >= 0 ? '+' : ''}{adj.adjustment_percentage.toFixed(1)}%)
                            </span>
                          </span>
                          <button
                            onClick={() => onNewFeeAdjustment({
                              treatmentId: treatment.id,
                              patientName: selectedPatient.name,
                              currentFee: treatment.current_fee,
                              previousFee: adj.previous_fee,
                              adjustment: adj
                            })}
                            className="text-teal-600 hover:text-teal-700"
                          >
                            ✎
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sessions */}
              {treatment.is_active && (
                <div className="border-t border-stone-200 pt-3 sm:pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-stone-600">Sesiones</h4>
                    <button
                      onClick={() => onNewSession(treatment.id, treatment.current_fee)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-teal-50 text-teal-600 rounded-md text-xs font-medium hover:bg-teal-100"
                    >
                      + Registrar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {sessions.slice(0, 10).map(session => (
                      <div
                        key={session.id}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-2 sm:p-3 rounded-lg text-xs sm:text-sm gap-2"
                      >
                        <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                          <span className="font-medium">{formatDate(session.session_date)}</span>
                          <span className="text-stone-500">{SESSION_TYPE_LABELS[session.session_type]}</span>
                          <span className="font-medium text-teal-600">{formatCurrency(session.fee_charged)}</span>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <button
                            onClick={() => toggleSessionPaid(session.id)}
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              session.is_paid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {session.is_paid ? '✓ Cobrada' : '○ Pendiente'}
                          </button>
                          <button
                            onClick={() => onEditSession(session, treatment)}
                            className="text-stone-400 hover:text-teal-600"
                          >
                            ✎
                          </button>
                        </div>
                      </div>
                    ))}

                    {sessions.length === 0 && (
                      <p className="text-center text-stone-400 py-4 text-xs sm:text-sm">
                        No hay sesiones registradas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {getPatientTreatments(selectedPatient.id).length === 0 && (
          <p className="text-center text-stone-400 py-6">
            No hay tratamientos registrados
          </p>
        )}
      </div>
    </>
  );
}
