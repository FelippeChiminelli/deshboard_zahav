import React from 'react';

interface ValueGaugeProps {
  current: number;
  max: number;
}

const ValueGauge: React.FC<ValueGaugeProps> = ({ current, max }) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  // Color logic based on percentage of completion
  const getColor = () => {
    if (percentage < 30) return 'bg-rose-500';
    if (percentage < 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col justify-center">
      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">R$</span>
        Indicador de Valor Ganho
      </h3>
      
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
              Progresso
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block text-emerald-600">
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-slate-200">
          <div 
            style={{ width: `${percentage}%` }} 
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${getColor()}`}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 font-medium font-mono">
          <span>R$ 0,00</span>
          <span className="text-slate-800 font-bold text-sm">R$ {current.toFixed(2)}</span>
          <span>R$ {max.toFixed(2)}</span>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 mt-4 text-center">
        Meta mensal de valor agregado pelo setor.
      </p>
    </div>
  );
};

export default ValueGauge;