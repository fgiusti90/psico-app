// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(form.email, form.password);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Debés confirmar tu email antes de iniciar sesión');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-600 mb-2">PsicoApp</h1>
          <p className="text-stone-500">Gestión de consultorio psicológico</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-6">Iniciar sesión</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link 
                href="/recuperar" 
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-500">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-teal-600 hover:text-teal-700 font-medium">
                Registrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
