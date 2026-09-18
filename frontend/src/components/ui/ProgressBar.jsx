import React from 'react';

const TONES = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500'
};

export default function ProgressBar({ value = 0, max = 1, tone = 'indigo', label, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
          <span>{label}</span>
          <span>{value}/{max}</span>
        </div>
      )}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${TONES[tone]} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
