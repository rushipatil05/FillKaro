import React from 'react';

export default function HeroCard({ children, className = '', title = '', subtitle = '' }) {
  return (
    <div className={`relative w-full mb-8 ${className}`}>
      {/* Dual Gradient Overlay Swapped Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 20%, rgba(139,92,246,0.12), transparent),
            radial-gradient(circle 500px at 80% 80%, rgba(59,130,246,0.09), transparent)
          `,
          backgroundSize: '48px 48px, 48px 48px, 100% 100%, 100% 100%',
        }}
      />

      <div className="relative z-10 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/40 shadow-lg p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              </div>

              {/* render the passed children (e.g. action buttons) */}
              <div className="flex items-center gap-3">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
