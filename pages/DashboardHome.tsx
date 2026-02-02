import React, { useEffect, useState } from 'react';
import { DashboardFilter, GeneralDashboardData } from '../types';
import { fetchGeneralDashboardData } from '../services/dashboardService';
import BrazilMap from '../components/BrazilMap';
import { Clock, AlertTriangle, AlertCircle, TrendingUp, Settings, HardHat, Loader2 } from 'lucide-react';

// Cores do tema
const COLORS = {
  primary: '#0810A6',
  primaryLight: '#2a32c4',
  primaryLighter: '#4a52d4',
  dark: '#142430',
  white: '#FFFFFF',
  black: '#000000',
};

interface DashboardHomeProps {
  filter: DashboardFilter;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ filter }) => {
  const [data, setData] = useState<GeneralDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        if (!cancelled) setLoading(true);
        setError(null);
        const dashboardData = await fetchGeneralDashboardData(filter);
        if (!cancelled) setData(dashboardData);
      } catch (err) {
        if (!cancelled) {
          console.error('Erro ao carregar dados do dashboard:', err);
          setError('Falha ao carregar dados. Tente novamente.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(loadData, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filter]);

  const getRevenueWidth = (val: number) => {
    return Math.min(val, 100);
  };

  const getProgressBar = (value: number, targetDays: number) => {
    const percentage = (value / targetDays) * 100;
    const width = Math.min(percentage, 100);
    const isOver = value > targetDays;
    return { width: `${width}%`, isOver };
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: COLORS.primary }} />
          <p className="font-medium" style={{ color: COLORS.black }}>Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-rose-800 mb-2">Erro ao carregar dados</h3>
          <p className="text-rose-600 text-sm">{error || 'Dados não disponíveis'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-white rounded-lg transition-colors"
            style={{ backgroundColor: COLORS.primary }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Top Section: Revenue Goals */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: COLORS.black }}>
              <TrendingUp className="w-5 h-5" style={{ color: COLORS.primary }} />
              Meta de Crescimento Anual
            </h2>
            <p className="text-xs text-slate-500">Progresso em relação à meta de {filter.year}</p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>{data.revenue.current}%</span>
             <span className="text-xs text-slate-400 block">da meta anual</span>
          </div>
        </div>

        <div className="relative pt-5 pb-1 px-2">
          {/* Progress Track */}
          <div className="h-3 bg-slate-100 rounded-full w-full overflow-hidden relative">
            <div 
              className="h-full transition-all duration-1000 ease-out relative"
              style={{ 
                width: `${getRevenueWidth(data.revenue.current)}%`,
                background: `linear-gradient(to right, ${COLORS.primaryLighter}, ${COLORS.primary})`
              }}
            >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 animate-pulse"></div>
            </div>
          </div>

          {/* Milestones Markers */}
          {(() => {
            const growthLabels = [11, 50, 100];
            return data.revenue.targets.map((position, idx) => (
              <div 
                key={idx}
                className="absolute top-0 flex flex-col items-center transform -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div className="mb-0.5 text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" style={{ color: COLORS.black }}>
                   {growthLabels[idx]}%
                </div>
                <div 
                  className="w-0.5 h-5"
                  style={{ backgroundColor: data.revenue.current >= position ? COLORS.primary : '#cbd5e1' }}
                ></div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Main Grid: Map, Time, Lists */}
      <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
        
        {/* Left Column: Map */}
        <div className="col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <BrazilMap points={data.mapPoints} heatPoints={data.heatPoints} />
        </div>

        {/* Middle Column: Time Metrics */}
        <div className="col-span-3 flex flex-col gap-3">
           
           {/* Card 1: Total Time */}
           <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center items-center text-center">
              <div className="p-2 rounded-full mb-1" style={{ backgroundColor: '#eef2ff' }}>
                  <Clock className="w-6 h-6" style={{ color: COLORS.primary }} />
              </div>
              <h3 className="font-medium text-xs uppercase tracking-wide" style={{ color: COLORS.black }}>Tempo Total</h3>
              <div className="mt-1">
                 <span className="text-4xl font-bold" style={{ color: COLORS.black }}>{data.timeMetrics.total}</span>
                 <span className="text-sm font-medium text-slate-400 ml-1">dias</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Média Global do Processo</p>
           </div>

           {/* Card 2: Operações */}
           <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <h3 className="font-bold text-sm" style={{ color: COLORS.black }}>Operações</h3>
                  </div>
                  {data.timeMetrics.operations > 3 ? 
                      <span className="bg-rose-100 text-rose-600 text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold">Atraso</span> : 
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#eef2ff', color: COLORS.primary }}>OK</span>
                  }
              </div>
              
              <div className="flex items-end justify-between mb-1">
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: COLORS.black }}>{data.timeMetrics.operations}</span>
                    <span className="text-xs text-slate-500">dias</span>
                 </div>
                 <span className="text-[10px] font-semibold text-slate-400">Meta: 72h (3d)</span>
              </div>
              
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: getProgressBar(data.timeMetrics.operations, 3).width,
                        backgroundColor: getProgressBar(data.timeMetrics.operations, 3).isOver ? '#ef4444' : COLORS.primary
                      }}
                   ></div>
              </div>
           </div>

           {/* Card 3: Engenharia */}
           <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                      <HardHat className="w-4 h-4 text-slate-400" />
                      <h3 className="font-bold text-sm" style={{ color: COLORS.black }}>Engenharia</h3>
                  </div>
                   {data.timeMetrics.engineering > 2 ? 
                      <span className="bg-rose-100 text-rose-600 text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold">Atraso</span> : 
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#eef2ff', color: COLORS.primary }}>OK</span>
                  }
              </div>
              
              <div className="flex items-end justify-between mb-1">
                 <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold" style={{ color: COLORS.black }}>{data.timeMetrics.engineering}</span>
                    <span className="text-xs text-slate-500">dias</span>
                 </div>
                 <span className="text-[10px] font-semibold text-slate-400">Meta: 48h (2d)</span>
              </div>
              
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                   <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: getProgressBar(data.timeMetrics.engineering, 2).width,
                        backgroundColor: getProgressBar(data.timeMetrics.engineering, 2).isOver ? '#ef4444' : COLORS.primary
                      }}
                   ></div>
              </div>
           </div>

        </div>

        {/* Right Column: Alerts Lists - altura fixa, scroll interno */}
        <div className="col-span-4 flex flex-col gap-3 min-h-0">
           
           {/* Overdue - altura fixa (metade da coluna), scroll na lista */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-3 bg-rose-50 border-b border-rose-100 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-rose-800 flex items-center gap-1.5 text-sm">
                   <AlertTriangle className="w-4 h-4" />
                   Em Atraso
                   <span className="text-rose-500 font-normal text-xs">(Mais de 48h)</span>
                </h3>
                 <span className="bg-white text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {data.tickets.delayed.length}
                 </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin">
                 {data.tickets.delayed.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-3">Nenhum caso de vistoria em aberto</p>
                 ) : (
                    data.tickets.delayed.map(ticket => (
                      <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                         <div>
                            <p className="font-semibold text-xs" style={{ color: COLORS.black }}>{ticket.client}</p>
                            <p className="text-[10px] text-slate-400">{ticket.id}</p>
                         </div>
                         <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            {ticket.info}
                         </span>
                      </div>
                    ))
                 )}
              </div>
           </div>

           {/* Pending */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="p-3 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a' }}>
                 <h3 className="font-bold flex items-center gap-1.5 text-sm" style={{ color: '#92400e' }}>
                    <AlertCircle className="w-4 h-4" />
                    Com Pendência
                 </h3>
                 <span className="bg-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm" style={{ color: '#d97706' }}>
                    {data.tickets.pending.length}
                 </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin">
                 {data.tickets.pending.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-3">Nenhum deal pendente</p>
                 ) : (
                    data.tickets.pending.slice(0, 5).map(ticket => (
                      <div key={ticket.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                         <div>
                            <p className="font-semibold text-xs" style={{ color: COLORS.black }}>{ticket.client}</p>
                            <p className="text-[10px] text-slate-400">{ticket.id}</p>
                         </div>
                         <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border max-w-[100px] truncate" style={{ color: '#92400e', backgroundColor: '#fef3c7', borderColor: '#fde68a' }} title={ticket.info}>
                            {ticket.info}
                         </span>
                      </div>
                    ))
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
