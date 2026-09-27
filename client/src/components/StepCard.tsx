import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

interface StepCardProps {
  step: number;
  title: string;
  description?: string;
  done?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

export function StepCard({ step, title, description, done = false, action, children }: StepCardProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
              done ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}
          >
            {done ? <Check className="w-4 h-4" strokeWidth={3} /> : step}
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white leading-8 m-0">{title}</h2>
            {description && <p className="text-sm text-slate-400 m-0">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
