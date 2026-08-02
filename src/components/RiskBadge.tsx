'use client';

import { ShieldAlert, ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

interface RiskBadgeProps {
  riskCategory?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function RiskBadge({
  riskCategory = 'LOW',
  score,
  size = 'md',
  showIcon = true,
}: RiskBadgeProps) {
  const getColors = () => {
    switch (riskCategory) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/20 border-red-500/40 text-red-400',
          dot: 'bg-red-500 animate-ping',
          icon: Flame,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
          dot: 'bg-orange-500',
          icon: ShieldAlert,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-500',
          icon: ShieldCheck,
        };
    }
  };

  const { bg, dot, icon: Icon } = getColors();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] space-x-1',
    md: 'px-2.5 py-1 text-xs space-x-1.5',
    lg: 'px-3 py-1.5 text-sm space-x-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wide rounded-full border backdrop-blur-md shadow-sm ${bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{riskCategory}</span>
      {score !== undefined && (
        <span className="font-mono font-semibold opacity-90">({score})</span>
      )}
      <span className={`w-1.5 h-1.5 rounded-full ${dot} inline-block ml-0.5`} />
    </span>
  );
}
