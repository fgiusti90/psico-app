// src/components/tabs/MetricsTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { StatCard, BillingTooltip, SessionsTooltip } from '@/components/ui';
import { formatCurrency, formatCurrencyShort, formatMonthYear, formatMonthShort } from '@/lib/utils';
import type { Patient, Treatment, Session } from '@/types/database';

interface MetricsTabProps {
  sessions: Session[];
  treatments: Treatment[];
  patients: Patient[];
}

// Tooltip personalizado para barras apiladas
const StackedBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const cobrado = payload.find((p: any) => p.dataKey === 'collected')?.value || 0;
    const pendiente = payload.find((p: any) => p.dataKey === 'pending')?.value || 0;
    const total = cobrado + pendiente;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="font-medium text-stone-800 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <p className="text-green-600">Cobrado: {formatCurrency(cobrado)}</p>
          <p className="text-amber-600">Pendiente: {formatCurrency(pendiente)}</p>
          <p className="text-stone-600 pt-1 border-t border-stone-100">Total: {formatCurrency(total)}</p>
        </div>
      </div>
    );
  }
  return null;
};

// Tooltip para gráfico de línea
const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="font-medium text-stone-800 mb-1">{label}</p>
        <p className="text-teal-600 text-sm">Promedio: {formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// Tooltip para top pacientes
const PatientTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="font-medium text-stone-800 mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <p className="text-teal-600">Total: {formatCurrency(data.total)}</p>
          <p className="text-stone-500">{data.sessions} prestaciones</p>
        </div>
      </div>
    );
  }
  return null;
};

export function MetricsTab({ sessions, treatments, patients }: MetricsTabProps) {
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [periodType, setPeriodType] = useState<'month' | 'year' | 'custom'>('year');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    sessions.forEach(s => {
      years.add(new Date(s.session_date).getFullYear());
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions]);

  const metrics = useMemo(() => {
    let filtered = [...sessions];

    // Filtrar por paciente
    if (patientFilter !== 'all') {
      const patientTreatments = treatments
        .filter(t => t.patient_id === patientFilter)
        .map(t => t.id);
      filtered = filtered.filter(s => patientTreatments.includes(s.treatment_id));
    }

    // Filtrar por período
    filtered = filtered.filter(session => {
      const sessionDate = new Date(session.session_date);
      const sessionYear = sessionDate.getFullYear();
      const sessionMonth = sessionDate.getMonth() + 1;

      if (periodType === 'month') {
        return sessionYear === year && sessionMonth === month;
      } else if (periodType === 'year') {
        return sessionYear === year;
      }
      return true;
    });

    // Calcular métricas
    const totalSessions = filtered.length;
    const paidSessions = filtered.filter(s => s.is_paid);
    const totalWorked = filtered.reduce((sum, s) => sum + s.fee_charged, 0);
    const totalCollected = paidSessions.reduce((sum, s) => sum + s.fee_charged, 0);
    const totalPending = totalWorked - totalCollected;
    const averageFee = filtered.length > 0 ? totalWorked / filtered.length : 0;
    const collectionRate = totalWorked > 0 ? (totalCollected / totalWorked) * 100 : 0;

    // Agrupar por mes
    const byMonth: Record<string, { total: number; paid: number; worked: number; collected: number }> = {};
    filtered.forEach(session => {
      const monthKey = session.session_date.slice(0, 7);
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { total: 0, paid: 0, worked: 0, collected: 0 };
      }
      byMonth[monthKey].total++;
      byMonth[monthKey].worked += session.fee_charged;
      if (session.is_paid) {
        byMonth[monthKey].paid++;
        byMonth[monthKey].collected += session.fee_charged;
      }
    });

    const monthlyData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, m]) => ({
        month: monthKey,
        monthLabel: formatMonthShort(monthKey + '-01'),
        ...m,
        pending: m.worked - m.collected,
        average: m.total > 0 ? m.worked / m.total : 0
      }));

    // Top pacientes por ingreso
    const byPatient: Record<string, { total: number; sessions: number; name: string }> = {};
    filtered.forEach(session => {
      const treatment = treatments.find(t => t.id === session.treatment_id);
      if (!treatment) return;
      const patient = patients.find(p => p.id === treatment.patient_id);
      if (!patient) return;

      if (!byPatient[patient.id]) {
        byPatient[patient.id] = { total: 0, sessions: 0, name: patient.name };
      }
      byPatient[patient.id].total += session.fee_charged;
      byPatient[patient.id].sessions++;
    });

    const topPatients = Object.values(byPatient)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalSessions,
      paidSessions: paidSessions.length,
      totalWorked,
      totalCollected,
      totalPending,
      averageFee,
      collectionRate,
      monthlyData,
      topPatients
    };
  }, [sessions, treatments, patients, patientFilter, periodType, year, month]);

  // Colores para el gráfico de top pacientes
  const patientColors = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

  return (
    <>
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Métricas</h2>
      </div>

      {/* Filtros */}
      <div className="bg-stone-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 items-end">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-stone-500 mb-1">Paciente</label>
            <select
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Todos los pacientes</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Período</label>
            <select
              value={periodType}
              onChange={e => setPeriodType(e.target.value as 'month' | 'year' | 'custom')}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="month">Mes</option>
              <option value="year">Año</option>
              <option value="custom">Todo</option>
            </select>
          </div>

          {(periodType === 'month' || periodType === 'year') && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Año</label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {periodType === 'month' && (
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Mes</label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i, 1).toLocaleDateString('es-AR', { month: 'short' })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Prestaciones" value={metrics.totalSessions} icon="📅" />
        <StatCard label="Cobradas" value={metrics.paidSessions} icon="✓" />
        <StatCard label="Trabajado" value={formatCurrencyShort(metrics.totalWorked)} icon="💼" />
        <StatCard label="Cobrado" value={formatCurrencyShort(metrics.totalCollected)} icon="💰" />
        <StatCard label="Promedio" value={formatCurrencyShort(metrics.averageFee)} icon="📊" />
      </div>

      {/* Tasa de cobranza */}
      {metrics.totalWorked > 0 && (
        <div className="bg-stone-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-stone-700 text-sm sm:text-base mb-1">Tasa de Cobranza</h3>
              <p className="text-xs text-stone-500">Porcentaje cobrado del total trabajado</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 sm:w-64">
                <div className="h-4 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.collectionRate >= 80 ? 'bg-green-500' :
                      metrics.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(metrics.collectionRate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-stone-500 mt-1">
                  <span>Cobrado: {formatCurrencyShort(metrics.totalCollected)}</span>
                  <span>Pendiente: {formatCurrencyShort(metrics.totalPending)}</span>
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${
                metrics.collectionRate >= 80 ? 'text-green-600' :
                metrics.collectionRate >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {metrics.collectionRate.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos principales */}
      {metrics.monthlyData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

          {/* Cobrado vs Pendiente (Barras apiladas) */}
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4">
            <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Cobrado vs Pendiente</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={45}
                  />
                  <Tooltip content={<StackedBarTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => value === 'collected' ? 'Cobrado' : 'Pendiente'}
                  />
                  <Bar dataKey="collected" stackId="a" fill="#22c55e" name="collected" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prestaciones por mes */}
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4">
            <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Prestaciones por mes</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    width={30}
                  />
                  <Tooltip content={<SessionsTooltip />} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {metrics.monthlyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#0d9488" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Evolución honorario promedio */}
          <div className="bg-stone-50 rounded-xl p-3 sm:p-4">
            <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Evolución Honorario Promedio</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={{ stroke: '#d6d3d1' }}
                    tickFormatter={(value) => formatCurrencyShort(value)}
                    width={45}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#0d9488' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top pacientes por ingreso */}
          {metrics.topPatients.length > 0 && patientFilter === 'all' && (
            <div className="bg-stone-50 rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Top 5 Pacientes por Ingreso</h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.topPatients}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={{ stroke: '#d6d3d1' }}
                      tickFormatter={(value) => formatCurrencyShort(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={{ stroke: '#d6d3d1' }}
                      width={80}
                      tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                    />
                    <Tooltip content={<PatientTooltip />} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {metrics.topPatients.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={patientColors[index % patientColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráfico trabajado (cuando hay un solo mes) */}
      {metrics.monthlyData.length === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top pacientes por ingreso */}
          {metrics.topPatients.length > 0 && patientFilter === 'all' && (
            <div className="bg-stone-50 rounded-xl p-3 sm:p-4">
              <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Top 5 Pacientes por Ingreso</h3>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.topPatients}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={{ stroke: '#d6d3d1' }}
                      tickFormatter={(value) => formatCurrencyShort(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#78716c' }}
                      axisLine={{ stroke: '#d6d3d1' }}
                      tickLine={{ stroke: '#d6d3d1' }}
                      width={80}
                      tickFormatter={(value) => value.length > 12 ? value.slice(0, 12) + '...' : value}
                    />
                    <Tooltip content={<PatientTooltip />} />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                      {metrics.topPatients.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={patientColors[index % patientColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla mensual */}
      {metrics.monthlyData.length > 0 && (
        <>
          <h3 className="font-semibold text-stone-700 mb-3 sm:mb-4 text-sm sm:text-base">Detalle por Mes</h3>

          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-2 mb-6">
            {metrics.monthlyData.slice().reverse().map(m => (
              <div key={m.month} className="bg-stone-50 rounded-lg p-3">
                <div className="font-medium capitalize text-sm mb-2">{formatMonthYear(m.month + '-01')}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500">Prestaciones:</span>
                    <span className="ml-1 font-medium">{m.total}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Cobradas:</span>
                    <span className="ml-1 font-medium">{m.paid}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Trabajado:</span>
                    <span className="ml-1 font-medium text-teal-600">{formatCurrency(m.worked)}</span>
                  </div>
                  <div>
                    <span className="text-stone-500">Cobrado:</span>
                    <span className="ml-1 font-medium text-green-600">{formatCurrency(m.collected)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-stone-50 rounded-xl overflow-hidden mb-8">
            <div className="grid grid-cols-7 gap-4 px-4 py-3 bg-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              <span>Mes</span>
              <span>Prestaciones</span>
              <span>Cobradas</span>
              <span>Trabajado</span>
              <span>Cobrado</span>
              <span>Pendiente</span>
              <span>Promedio</span>
            </div>
            {metrics.monthlyData.slice().reverse().map(m => (
              <div key={m.month} className="grid grid-cols-7 gap-4 px-4 py-3 border-t border-stone-200 text-sm">
                <span className="capitalize">{formatMonthYear(m.month + '-01')}</span>
                <span>{m.total}</span>
                <span>{m.paid}</span>
                <span className="text-teal-600">{formatCurrency(m.worked)}</span>
                <span className="text-green-600">{formatCurrency(m.collected)}</span>
                <span className="text-amber-600">{formatCurrency(m.pending)}</span>
                <span>{formatCurrency(m.average)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {metrics.totalSessions === 0 && (
        <p className="text-center text-stone-400 py-10">
          No hay datos para los filtros seleccionados
        </p>
      )}
    </>
  );
}