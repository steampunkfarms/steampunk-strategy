'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/bridge');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-tardis-dim flex items-center justify-center px-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(77,168,218,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(77,168,218,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="console-card p-8 text-center">
          {/* TARDIS icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tardis to-tardis-dark flex items-center justify-center shadow-lg shadow-tardis/30 mx-auto mb-6 temporal-glow">
            <span className="text-tardis-glow text-2xl font-display font-bold">TB</span>
          </div>

          <h1 className="text-xl font-display font-bold text-slate-100">The Bridge</h1>
          <p className="text-sm text-brass-muted mt-1 mb-2">
            Steampunk Strategy Command
          </p>
          <p className="text-xs text-slate-500 mb-8">
            Financial management, compliance & operations
          </p>

          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/bridge' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0078d4] hover:bg-[#006cc1] text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>

          <div className="brass-divider mt-8 mb-4" />

          <p className="text-xs text-slate-500">
            Steampunk Farms Rescue Barn, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
