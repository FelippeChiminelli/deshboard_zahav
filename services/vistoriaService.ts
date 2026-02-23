import { supabase } from '../lib/supabase';
import type { DealOrcadoRealizado, Vistoriador } from '../types/database';
import type { DashboardFilter } from '../types';
import { fetchDeals, calculateTimeMetrics } from './dashboardService';

export interface DailyChartPoint {
  name: string;
  orcado: number;
  realizado: number;
}

export interface VistoriaKPIs {
  orcadoVsRealizadoPercent: number;
  totalVistorias: number;
  metaVistorias: number;
  novosVistoriadores: number;
  metaVistoriadores: number;
  tempoMedioOps: number;
}

export interface ValorGanho {
  atual: number;
  meta: number;
  percentual: number;
}

export interface VistoriaData {
  kpis: VistoriaKPIs;
  chartData: DailyChartPoint[];
  valorGanho: ValorGanho;
  totalRegistros: number;
}

const formatDateString = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const fetchDealsOrcadoRealizado = async (filter: DashboardFilter): Promise<DealOrcadoRealizado[]> => {
  const startOfMonth = formatDateString(filter.year, filter.month, 1);
  const lastDay = new Date(filter.year, filter.month + 1, 0).getDate();
  const endOfMonth = formatDateString(filter.year, filter.month, lastDay);

  const { data, error } = await supabase
    .from('deals_orcadoxrealizado')
    .select('*')
    .gte('start_date_ploomes', startOfMonth)
    .lte('start_date_ploomes', endOfMonth + 'T23:59:59');

  if (error) {
    console.error('Erro ao buscar deals_orcadoxrealizado:', error);
    return [];
  }

  return (data as DealOrcadoRealizado[]) || [];
};

const fetchNovosVistoriadores = async (filter: DashboardFilter): Promise<number> => {
  const startOfMonth = formatDateString(filter.year, filter.month, 1);
  const lastDay = new Date(filter.year, filter.month + 1, 0).getDate();
  const endOfMonth = formatDateString(filter.year, filter.month, lastDay);

  const { data, error } = await supabase
    .from('vistoriadores')
    .select('id')
    .gte('data_criacao', startOfMonth)
    .lte('data_criacao', endOfMonth + 'T23:59:59');

  if (error) {
    console.error('Erro ao buscar vistoriadores:', error);
    return 0;
  }

  return data?.length ?? 0;
};

const TIPOS_TECNICOS = [
  'engenheiro',
  'arquiteto',
  'engenheiro civil',
  'engenheira civil',
  'arquiteta',
  'tec. agrimensor',
];

const isTecnico = (tipo: string | null): boolean => {
  if (!tipo) return false;
  return TIPOS_TECNICOS.includes(tipo.toLowerCase().trim());
};

const calcularKPIs = (deals: DealOrcadoRealizado[]): VistoriaKPIs => {
  const dealsComValor = deals.filter(d => d.valor_realizado != null);
  const totalOrcado = dealsComValor.reduce((sum, d) => sum + (d.valor_orcado ?? 0), 0);
  const totalRealizado = dealsComValor.reduce((sum, d) => sum + (d.valor_realizado ?? 0), 0);
  const orcadoPercent = totalOrcado > 0
    ? Math.round((totalRealizado / totalOrcado) * 100)
    : 0;

  const totalDeals = deals.length;
  const totalTecnicas = deals.filter(d => isTecnico(d.tipo_vistoriador)).length;
  const percentTecnicas = totalDeals > 0
    ? Math.round((totalTecnicas / totalDeals) * 100)
    : 0;

  const vistoriadoresUnicos = new Set(
    deals.filter(d => d.id_vistoriador).map(d => d.id_vistoriador)
  );

  return {
    orcadoVsRealizadoPercent: orcadoPercent,
    totalVistorias: percentTecnicas,
    metaVistorias: 95,
    novosVistoriadores: vistoriadoresUnicos.size,
    metaVistoriadores: 5,
    tempoMedioOps: 0,
  };
};

const calcularChartData = (deals: DealOrcadoRealizado[], filter: DashboardFilter): DailyChartPoint[] => {
  const diasNoMes = new Date(filter.year, filter.month + 1, 0).getDate();
  const points: DailyChartPoint[] = [];

  let acumOrcado = 0;
  let acumRealizado = 0;

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dealsDoDia = deals.filter(d => {
      if (!d.start_date_ploomes) return false;
      const date = new Date(d.start_date_ploomes);
      return date.getDate() === dia;
    });

    const orcadoDia = dealsDoDia.reduce((sum, d) => sum + (d.valor_orcado ?? 0), 0);
    const realizadoDia = dealsDoDia.reduce((sum, d) => sum + (d.valor_realizado ?? 0), 0);

    acumOrcado += orcadoDia;
    acumRealizado += realizadoDia;

    points.push({
      name: String(dia),
      orcado: Math.round(acumOrcado * 100) / 100,
      realizado: Math.round(acumRealizado * 100) / 100,
    });
  }

  return points;
};

const calcularValorGanho = (deals: DealOrcadoRealizado[]): ValorGanho => {
  const dealsComValor = deals.filter(d => d.valor_realizado != null);
  const totalRealizado = dealsComValor.reduce((sum, d) => sum + (d.valor_realizado ?? 0), 0);
  const totalOrcado = dealsComValor.reduce((sum, d) => sum + (d.valor_orcado ?? 0), 0);

  const meta = totalOrcado > 0 ? totalOrcado : 1000;
  const percentual = meta > 0 ? Math.round((totalRealizado / meta) * 1000) / 10 : 0;

  return {
    atual: Math.round(totalRealizado * 100) / 100,
    meta: Math.round(meta * 100) / 100,
    percentual,
  };
};

export const fetchVistoriaData = async (filter: DashboardFilter): Promise<VistoriaData> => {
  const [dealsOrcado, dealsPloomes, novosVistoriadores] = await Promise.all([
    fetchDealsOrcadoRealizado(filter),
    fetchDeals(filter),
    fetchNovosVistoriadores(filter),
  ]);

  const timeMetrics = calculateTimeMetrics(dealsPloomes);
  const kpis = calcularKPIs(dealsOrcado);
  kpis.tempoMedioOps = timeMetrics.operations;
  kpis.novosVistoriadores = novosVistoriadores;

  const chartData = calcularChartData(dealsOrcado, filter);
  const valorGanho = calcularValorGanho(dealsOrcado);

  return {
    kpis,
    chartData,
    valorGanho,
    totalRegistros: dealsOrcado.length,
  };
};
