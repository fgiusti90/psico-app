// src/app/registro/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RegistroPage() {
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await signUp(form.email, form.password, form.fullName);
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError('Este email ya está registrado');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-xl font-semibold text-stone-800 mb-2">
              ¡Verificá tu email!
            </h2>
            <p className="text-stone-500 mb-6">
              Te enviamos un email a <strong>{form.email}</strong> con un link para confirmar tu cuenta.
            </p>
            <p className="text-sm text-stone-400 mb-6">
              Revisá tu bandeja de spam si no lo encontrás.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-600 mb-2">PsicoApp</h1>
          <p className="text-stone-500">Creá tu cuenta gratis</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-6">Registro</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="Repetí tu contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-500">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}