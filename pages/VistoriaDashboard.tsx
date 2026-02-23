import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DashboardFilter } from '../types';
import { fetchVistoriaData, VistoriaData } from '../services/vistoriaService';
import { Loader2, TrendingUp, Eye, Users, Clock, DollarSign, Info } from 'lucide-react';

const COLORS = {
  primary: '#0810A6',
  primaryLight: '#2a32c4',
  black: '#000000',
  white: '#FFFFFF',
};

interface VistoriaDashboardProps {
  filter: DashboardFilter;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const KPICard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}> = ({ title, value, subtitle, icon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
      <div className="text-slate-300">{icon}</div>
    </div>
    <span className="text-3xl font-bold" style={{ color: COLORS.black }}>{value}</span>
    <span className="text-[10px] text-slate-400 mt-1">{subtitle}</span>
  </div>
);

const VistoriaDashboard: React.FC<VistoriaDashboardProps> = ({ filter }) => {
  const [data, setData] = useState<VistoriaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!cancelled) setLoading(true);
      const result = await fetchVistoriaData(filter);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: COLORS.primary }} />
          <p className="font-medium text-slate-600">Carregando dados de vistorias...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, chartData, valorGanho } = data;
  const progressWidth = Math.min(valorGanho.percentual, 100);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard
          title="Orçado vs Realizado"
          value={`${kpis.orcadoVsRealizadoPercent}%`}
          subtitle="Acumulado Mês"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KPICard
          title="Vistorias Técnicas"
          value={`${kpis.totalVistorias}%`}
          subtitle={`Meta: >${kpis.metaVistorias}%`}
          icon={<Eye className="w-4 h-4" />}
        />
        <KPICard
          title="Novos Vistoriadores"
          value={`${kpis.novosVistoriadores}`}
          subtitle={`Meta: ${kpis.metaVistoriadores}`}
          icon={<Users className="w-4 h-4" />}
        />
        <KPICard
          title="Tempo Médio (Ops)"
          value={kpis.tempoMedioOps > 0 ? `${kpis.tempoMedioOps} dias` : '—'}
          subtitle=""
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Chart + Valor Ganho */}
      <div className="grid grid-cols-3 gap-3">
        {/* Gráfico evolução diária */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 className="text-sm font-bold mb-4" style={{ color: COLORS.black }}>
            Evolução Acumulada Diária: Orçado vs Realizado
          </h3>
          <div className="h-72" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => v.toLocaleString('pt-BR')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'orcado' ? 'Orçado' : 'Realizado'
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => value === 'orcado' ? 'Orçado' : 'Realizado'}
                />
                <Area
                  type="monotone"
                  dataKey="orcado"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="realizado"
                  stroke="#93bbfd"
                  strokeWidth={2}
                  fill="#93bbfd"
                  fillOpacity={0.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indicador de Valor Ganho */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4" style={{ color: COLORS.primary }} />
            <h3 className="text-sm font-bold" style={{ color: COLORS.black }}>
              Indicador de Valor Ganho
            </h3>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Progresso</span>
              <span className="text-xs font-bold" style={{ color: COLORS.primary }}>
                {valorGanho.percentual}%
              </span>
            </div>

            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ 
                  width: `${progressWidth}%`, 
                  backgroundColor: COLORS.primary 
                }}
              />
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400">R$ 0,00</span>
              <span className="text-lg font-bold" style={{ color: COLORS.black }}>
                {formatCurrency(valorGanho.atual)}
              </span>
              <span className="text-[10px] text-slate-400">{formatCurrency(valorGanho.meta)}</span>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-2">
              Meta mensal de valor agregado pelo setor.
            </p>
          </div>
        </div>
      </div>

      {/* Nota de Gestão */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          <strong>Nota de Gestão:</strong> As metas de 40, 60 e 100 são escalonadas conforme a senioridade 
          e demanda do período. O indicador de valor ganho reflete a eficiência operacional convertida em 
          bônus ou economia gerada.
        </p>
      </div>
    </div>
  );
};

export default VistoriaDashboard;
