import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData } from '../../types';

interface KPICardProps {
  data: KPIData;
}

const KPICard: React.FC<KPICardProps> = ({ data }) => {
  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-rose-500" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getColorClass = () => {
    switch (data.color) {
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'green': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'red': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'yellow': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{data.label}</h3>
        <div className={`p-1.5 rounded-full ${getColorClass()}`}>
          {data.trend ? getTrendIcon() : <div className="w-4 h-4 rounded-full bg-current opacity-20" />}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-800">{data.value}</span>
      </div>
      {data.subValue && (
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {data.subValue}
        </p>
      )}
    </div>
  );
};

export default KPICard;