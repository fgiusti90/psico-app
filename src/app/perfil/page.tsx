// src/app/perfil/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function PerfilPage() {
  const router = useRouter();
  const { profile, updateProfile } = useAuth();

  const [form, setForm] = useState({
    full_name: '',
    license_number: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        full_name: profile.full_name || '',
        license_number: profile.license_number || '',
        phone: profile.phone || ''
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await updateProfile({
        full_name: form.full_name,
        license_number: form.license_number || null,
        phone: form.phone || null
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al actualizar el perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
          >
            ← Volver al inicio
          </button>
          <h1 className="text-xl font-bold text-teal-600">PsicoApp</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {form.full_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-stone-800">Mi Perfil</h2>
              <p className="text-sm text-stone-500">Editá tu información profesional</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              ✓ Perfil actualizado correctamente
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Nombre completo *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Matrícula profesional
              </label>
              <input
                type="text"
                value={form.license_number}
                onChange={e => setForm({ ...form, license_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="MN 12345"
              />
              <p className="mt-1 text-xs text-stone-400">
                Se mostrará en tu menú de usuario
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="+54 11 1234-5678"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}