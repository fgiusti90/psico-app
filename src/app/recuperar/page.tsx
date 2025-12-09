// src/app/recuperar/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function RecuperarPage() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error al enviar el email');
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
              ¡Email enviado!
            </h2>
            <p className="text-stone-500 mb-6">
              Te enviamos un email a <strong>{email}</strong> con instrucciones para restablecer tu contraseña.
            </p>
            <Link 
              href="/login"
              className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Volver a iniciar sesión
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
          <p className="text-stone-500">Recuperar contraseña</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-2">¿Olvidaste tu contraseña?</h2>
          <p className="text-stone-500 text-sm mb-6">
            Ingresá tu email y te enviaremos un link para restablecerla.
          </p>

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
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none focus:border-teal-500 transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <Link href="/login" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
