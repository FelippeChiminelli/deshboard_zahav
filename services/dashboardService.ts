import { supabase } from '../lib/supabase';
import type { DealPloomes, PendenciaEngenharia, CasoVistoria } from '../types/database';
import type { GeneralDashboardData, DashboardFilter, TicketAlert, MapPoint, HeatPoint } from '../types';

// Coordenadas aproximadas dos estados no mapa SVG (x, y em porcentagem)
const STATE_COORDINATES: Record<string, { x: number; y: number }> = {
  'AC': { x: 18, y: 42 },
  'AL': { x: 88, y: 48 },
  'AP': { x: 52, y: 22 },
  'AM': { x: 30, y: 35 },
  'BA': { x: 78, y: 50 },
  'CE': { x: 85, y: 38 },
  'DF': { x: 63, y: 58 },
  'ES': { x: 80, y: 65 },
  'GO': { x: 60, y: 58 },
  'MA': { x: 70, y: 35 },
  'MT': { x: 45, y: 52 },
  'MS': { x: 48, y: 68 },
  'MG': { x: 70, y: 62 },
  'PA': { x: 50, y: 32 },
  'PB': { x: 90, y: 42 },
  'PR': { x: 58, y: 75 },
  'PE': { x: 88, y: 42 },
  'PI': { x: 75, y: 40 },
  'RJ': { x: 74, y: 70 },
  'RN': { x: 88, y: 38 },
  'RS': { x: 55, y: 85 },
  'RO': { x: 28, y: 48 },
  'RR': { x: 32, y: 18 },
  'SC': { x: 58, y: 80 },
  'SP': { x: 62, y: 70 },
  'SE': { x: 85, y: 48 },
  'TO': { x: 62, y: 45 },
};

/**
 * Calcula a diferença em dias entre duas datas
 */
const calculateDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return diffTime / (1000 * 60 * 60 * 24);
};

/**
 * Formata data para o padrão YYYY-MM-DD
 */
const formatDateString = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

/**
 * Busca todos os deals do Supabase com filtro opcional de período
 * Filtra pela coluna finish_date baseado no mês/ano selecionado
 * (considera como "virada do mês" a data de finalização)
 */
export const fetchDeals = async (filter?: DashboardFilter): Promise<DealPloomes[]> => {
  let query = supabase
    .from('deals_ploomes')
    .select('*')
    .order('finish_date', { ascending: false });

  // Aplica filtro de mês/ano se fornecido (baseado em finish_date)
  if (filter) {
    // Primeiro dia do mês (formato YYYY-MM-DD)
    const startOfMonth = formatDateString(filter.year, filter.month, 1);
    // Último dia do mês
    const lastDay = new Date(filter.year, filter.month + 1, 0).getDate();
    const endOfMonth = formatDateString(filter.year, filter.month, lastDay);
    
    query = query
      .gte('finish_date', startOfMonth)
      .lte('finish_date', endOfMonth + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar deals:', error);
    throw error;
  }

  console.log(`[fetchDeals] Filtro finish_date: ${filter?.month}/${filter?.year}, Resultados: ${data?.length || 0}`);
  
  return data || [];
};

/**
 * Calcula métricas de tempo a partir dos deals usando os campos reais
 * Fluxo: [start_date] → Operações → [fim_operacoes] → Engenharia → [fim_engenharia] → Operações → [finish_date]
 * 
 * - Tempo total = finish_date - start_date
 * - Tempo de operações = (fim_operacoes - start_date) + (finish_date - fim_engenharia)
 * - Tempo de engenharia = fim_engenharia - fim_operacoes
 */
export const calculateTimeMetrics = (deals: DealPloomes[]) => {
  // Deals com tempo total (start_date e finish_date)
  const dealsWithTotal = deals.filter(d => d.start_date && d.finish_date);
  
  // Deals com todos os campos para calcular operações corretamente
  const dealsWithFullOperations = deals.filter(d => 
    d.start_date && d.fim_operacoes && d.fim_engenharia && d.finish_date
  );
  
  // Deals com tempo de engenharia (fim_operacoes e fim_engenharia)
  const dealsWithEngineering = deals.filter(d => d.fim_operacoes && d.fim_engenharia);

  // Calcula média do tempo total
  let avgTotal = 0;
  if (dealsWithTotal.length > 0) {
    const totalDurations = dealsWithTotal.map(d => 
      calculateDaysDifference(d.start_date!, d.finish_date!)
    );
    avgTotal = totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length;
  }

  // Calcula média do tempo de operações (duas partes: antes e depois de engenharia)
  let avgOperations = 0;
  if (dealsWithFullOperations.length > 0) {
    const operationsDurations = dealsWithFullOperations.map(d => {
      // Parte 1: start_date até fim_operacoes
      const parte1 = calculateDaysDifference(d.start_date!, d.fim_operacoes!);
      // Parte 2: fim_engenharia até finish_date
      const parte2 = calculateDaysDifference(d.fim_engenharia!, d.finish_date!);
      return parte1 + parte2;
    });
    avgOperations = operationsDurations.reduce((a, b) => a + b, 0) / operationsDurations.length;
  }

  // Calcula média do tempo de engenharia
  let avgEngineering = 0;
  if (dealsWithEngineering.length > 0) {
    const engineeringDurations = dealsWithEngineering.map(d => 
      calculateDaysDifference(d.fim_operacoes!, d.fim_engenharia!)
    );
    avgEngineering = engineeringDurations.reduce((a, b) => a + b, 0) / engineeringDurations.length;
  }

  return {
    total: Number(avgTotal.toFixed(1)),
    operations: Number(avgOperations.toFixed(1)),
    engineering: Number(avgEngineering.toFixed(1)),
  };
};

const HORAS_PRAZO_ATRASO_VISTORIA = 48; // 48 horas úteis (2 dias úteis)
const HORAS_UTEIS_POR_DIA = 24; // 24h por dia

/**
 * Lista de feriados nacionais brasileiros (formato MM-DD)
 * Atualizar anualmente conforme necessário
 */
const FERIADOS_FIXOS = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // Nossa Senhora Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
];

/**
 * Feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi)
 * Calculados com base na Páscoa
 */
const getFeriadosMoveis = (ano: number): string[] => {
  // Cálculo da Páscoa (algoritmo de Meeus/Jones/Butcher)
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  
  const pascoa = new Date(ano, mes - 1, dia);
  
  // Carnaval: 47 dias antes da Páscoa (segunda e terça)
  const carnavalTerca = new Date(pascoa);
  carnavalTerca.setDate(pascoa.getDate() - 47);
  const carnavalSegunda = new Date(carnavalTerca);
  carnavalSegunda.setDate(carnavalTerca.getDate() - 1);
  
  // Sexta-feira Santa: 2 dias antes da Páscoa
  const sextaSanta = new Date(pascoa);
  sextaSanta.setDate(pascoa.getDate() - 2);
  
  // Corpus Christi: 60 dias após a Páscoa
  const corpusChristi = new Date(pascoa);
  corpusChristi.setDate(pascoa.getDate() + 60);
  
  const formatDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };
  
  return [
    formatDate(carnavalSegunda),
    formatDate(carnavalTerca),
    formatDate(sextaSanta),
    formatDate(corpusChristi),
  ];
};

/**
 * Verifica se uma data é feriado
 */
const isFeriado = (date: Date): boolean => {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  // Verifica feriados fixos
  if (FERIADOS_FIXOS.includes(mmdd)) return true;
  
  // Verifica feriados móveis do ano
  const feriadosMoveis = getFeriadosMoveis(date.getFullYear());
  return feriadosMoveis.includes(mmdd);
};

/**
 * Verifica se um dia é útil (não é fim de semana nem feriado)
 */
const isDiaUtil = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  // Sábado (6) ou Domingo (0) não são úteis
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  // Verifica se é feriado
  return !isFeriado(date);
};

/**
 * Calcula as horas úteis entre duas datas
 * Considera 24h por dia, descontando fins de semana e feriados
 */
const calcularHorasUteisOtimizado = (startDate: Date, endDate: Date): number => {
  if (startDate >= endDate) return 0;

  let horasUteis = 0;
  const current = new Date(startDate);
  
  // Normaliza para início do dia se não for dia útil
  if (!isDiaUtil(current)) {
    current.setHours(0, 0, 0, 0);
    // Avança para o próximo dia útil
    while (!isDiaUtil(current) && current < endDate) {
      current.setDate(current.getDate() + 1);
    }
  }

  while (current < endDate) {
    if (!isDiaUtil(current)) {
      // Pula dia não útil (fim de semana ou feriado)
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }

    // Calcula horas úteis do dia atual (24h completas ou parcial)
    const fimDoDia = new Date(current);
    fimDoDia.setHours(23, 59, 59, 999);
    
    const inicioCalculo = current;
    const fimCalculo = endDate < fimDoDia ? endDate : fimDoDia;
    
    if (inicioCalculo < fimCalculo) {
      const horasDoDia = (fimCalculo.getTime() - inicioCalculo.getTime()) / (1000 * 60 * 60);
      horasUteis += Math.max(0, horasDoDia);
    }

    // Avança para o próximo dia
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return horasUteis;
};

/**
 * Converte data_vistoria (ISO string, ou Unix timestamp em segundos como number/string) para ms.
 * Rejeita 0/"0" (gera 1970 e "20302 dias"). Timestamp em segundos: multiplica por 1000.
 */
const dataVistoriaToMs = (value: string | number | null | undefined): number | null => {
  if (value == null) return null;
  if (value === 0 || value === '0') return null;
  if (typeof value === 'number') {
    if (value < 1e12) return value * 1000;
    return value;
  }
  const str = String(value).trim();
  if (str === '' || str === '0') return null;
  const asNum = Number(str);
  if (!Number.isNaN(asNum) && asNum <= 0) return null;
  if (!Number.isNaN(asNum) && asNum < 1e12) return asNum * 1000;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms) || ms <= 0) return null;
  return ms;
};

/**
 * Retorna horas úteis desde data_vistoria até agora
 */
const getHorasUteisSince = (dateValue: string | number | null): number => {
  const start = dataVistoriaToMs(dateValue);
  if (start == null) return 0;
  return calcularHorasUteisOtimizado(new Date(start), new Date());
};

/**
 * Retorna horas totais (corridas) desde data_vistoria até agora
 */
const getHoursSince = (dateValue: string | number | null): number => {
  const start = dataVistoriaToMs(dateValue);
  if (start == null) return 0;
  const now = Date.now();
  return (now - start) / (1000 * 60 * 60);
};

/**
 * Busca casos de vistoria do Supabase (tabela casos_vistoria).
 * Filtra pela coluna start_date baseado no mês/ano selecionado.
 * Requer política RLS que permita SELECT para o role anon.
 */
const fetchCasosVistoria = async (filter?: DashboardFilter): Promise<CasoVistoria[]> => {
  let query = supabase
    .from('casos_vistoria')
    .select('*')
    .order('data_vistoria', { ascending: false });

  // Aplica filtro de mês/ano se fornecido
  if (filter) {
    const startOfMonth = formatDateString(filter.year, filter.month, 1);
    const lastDay = new Date(filter.year, filter.month + 1, 0).getDate();
    const endOfMonth = formatDateString(filter.year, filter.month, lastDay);
    
    query = query
      .gte('start_date', startOfMonth)
      .lte('start_date', endOfMonth + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar casos_vistoria:', error);
    return [];
  }

  const list = (data ?? []) as CasoVistoria[];
  console.log(`[fetchCasosVistoria] Filtro: ${filter?.month}/${filter?.year}, Resultados: ${list.length}`);
  
  if (list.length === 0 && !error) {
    console.warn(
      '[Dashboard] Nenhuma linha em casos_vistoria para o período selecionado.'
    );
  }
  return list;
};

/**
 * Filtra casos em atraso: data_vistoria há mais de 48 HORAS ÚTEIS
 * Considera: Segunda a Sexta, 8h às 18h (10h úteis por dia)
 */
const getDelayedFromCasosVistoria = (casos: CasoVistoria[]): TicketAlert[] => {
  return casos
    .filter(c => {
      const horasUteis = getHorasUteisSince(c.data_vistoria);
      return horasUteis > HORAS_PRAZO_ATRASO_VISTORIA;
    })
    .sort((a, b) => {
      // Ordena por horas úteis (mais atrasado primeiro)
      const aHoras = getHorasUteisSince(a.data_vistoria);
      const bHoras = getHorasUteisSince(b.data_vistoria);
      return bHoras - aHoras; // mais horas úteis = mais atrasado no topo
    })
    .map(c => {
      const horasUteis = getHorasUteisSince(c.data_vistoria);
      if (horasUteis <= 0) return null;
      
      // Converte horas úteis para dias úteis e horas (10h úteis = 1 dia útil)
      const diasUteis = Math.floor(horasUteis / HORAS_UTEIS_POR_DIA);
      const horasRestantes = Math.floor(horasUteis % HORAS_UTEIS_POR_DIA);
      
      const info = diasUteis > 0
        ? `${diasUteis}d ${horasRestantes}h úteis em aberto`
        : `${Math.floor(horasUteis)}h úteis em aberto`;

      return {
        id: `VISTORIA-${c.id_deal ?? c.id}`,
        client: c.title || `Caso #${c.id_deal ?? c.id}`,
        info,
        status: 'delayed' as const,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t != null);
};

/**
 * Identifica deals pendentes (sem data de finalização)
 */
const getPendingDeals = (deals: DealPloomes[]): TicketAlert[] => {
  return deals
    .filter(deal => deal.start_date && !deal.finish_date)
    .slice(0, 10) // Limita a 10 itens
    .map(deal => ({
      id: `DEAL-${deal.id_deal || deal.id}`,
      client: `Deal #${deal.id_deal || deal.id}`,
      info: 'Aguardando conclusão',
      status: 'pending' as const,
    }));
};

/**
 * Busca pendências de engenharia do Supabase
 * Filtra pela coluna created_at baseado no mês/ano selecionado.
 */
const fetchPendenciasEngenharia = async (filter?: DashboardFilter): Promise<PendenciaEngenharia[]> => {
  let query = supabase
    .from('pendencias_engenharia')
    .select('*')
    .order('created_at', { ascending: false });

  // Aplica filtro de mês/ano se fornecido
  if (filter) {
    const startOfMonth = formatDateString(filter.year, filter.month, 1);
    const lastDay = new Date(filter.year, filter.month + 1, 0).getDate();
    const endOfMonth = formatDateString(filter.year, filter.month, lastDay);
    
    query = query
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar pendências:', error);
    return [];
  }

  console.log(`[fetchPendenciasEngenharia] Filtro: ${filter?.month}/${filter?.year}, Resultados: ${data?.length || 0}`);
  
  return data || [];
};

/**
 * Converte pendências de engenharia para TicketAlert
 */
const getPendenciasAsTickets = (pendencias: PendenciaEngenharia[]): TicketAlert[] => {
  return pendencias.map(pendencia => ({
    id: `DEAL-${pendencia.id_deal || pendencia.id}`,
    client: pendencia.title || `Deal #${pendencia.id_deal || pendencia.id}`,
    info: `DEAL-${pendencia.id_deal || pendencia.id}`,
    status: 'pending' as const,
  }));
};

/**
 * Bounding boxes aproximados dos estados brasileiros (lat_min, lat_max, lng_min, lng_max)
 */
const STATE_BOUNDS: Record<string, { latMin: number; latMax: number; lngMin: number; lngMax: number }> = {
  'AC': { latMin: -11.15, latMax: -7.11, lngMin: -73.99, lngMax: -66.63 },
  'AL': { latMin: -10.50, latMax: -8.81, lngMin: -38.24, lngMax: -35.15 },
  'AP': { latMin: 4.44, latMax: -1.23, lngMin: -54.87, lngMax: -49.87 },
  'AM': { latMin: -9.82, latMax: 2.25, lngMin: -73.79, lngMax: -56.10 },
  'BA': { latMin: -18.35, latMax: -8.53, lngMin: -46.62, lngMax: -37.34 },
  'CE': { latMin: -7.86, latMax: -2.78, lngMin: -41.42, lngMax: -37.25 },
  'DF': { latMin: -16.05, latMax: -15.50, lngMin: -48.29, lngMax: -47.31 },
  'ES': { latMin: -21.30, latMax: -17.89, lngMin: -41.88, lngMax: -39.68 },
  'GO': { latMin: -19.50, latMax: -12.39, lngMin: -53.25, lngMax: -45.91 },
  'MA': { latMin: -10.26, latMax: -1.05, lngMin: -48.76, lngMax: -41.79 },
  'MT': { latMin: -18.04, latMax: -7.35, lngMin: -61.63, lngMax: -50.22 },
  'MS': { latMin: -24.07, latMax: -17.17, lngMin: -58.17, lngMax: -53.26 },
  'MG': { latMin: -22.92, latMax: -14.23, lngMin: -51.05, lngMax: -39.86 },
  'PA': { latMin: -9.84, latMax: 2.59, lngMin: -58.90, lngMax: -46.06 },
  'PB': { latMin: -8.30, latMax: -6.02, lngMin: -38.77, lngMax: -34.79 },
  'PR': { latMin: -26.72, latMax: -22.52, lngMin: -54.62, lngMax: -48.02 },
  'PE': { latMin: -9.49, latMax: -7.15, lngMin: -41.36, lngMax: -34.81 },
  'PI': { latMin: -10.93, latMax: -2.74, lngMin: -45.99, lngMax: -40.37 },
  'RJ': { latMin: -23.37, latMax: -20.76, lngMin: -44.89, lngMax: -40.96 },
  'RN': { latMin: -6.98, latMax: -4.83, lngMin: -38.58, lngMax: -34.97 },
  'RS': { latMin: -33.75, latMax: -27.08, lngMin: -57.65, lngMax: -49.69 },
  'RO': { latMin: -13.69, latMax: -7.97, lngMin: -66.62, lngMax: -59.77 },
  'RR': { latMin: 5.27, latMax: -1.00, lngMin: -64.82, lngMax: -58.88 },
  'SC': { latMin: -29.35, latMax: -25.96, lngMin: -53.84, lngMax: -48.36 },
  'SP': { latMin: -25.31, latMax: -19.78, lngMin: -53.11, lngMax: -44.16 },
  'SE': { latMin: -11.57, latMax: -9.51, lngMin: -38.25, lngMax: -36.39 },
  'TO': { latMin: -13.47, latMax: -5.17, lngMin: -50.73, lngMax: -45.73 },
};

/**
 * Converte coordenadas (lat, lng) para o código do estado brasileiro
 */
const coordinatesToState = (coordenadas: string): string | null => {
  try {
    const [latStr, lngStr] = coordenadas.split(',').map(s => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) return null;

    // Procura o estado que contém essas coordenadas
    for (const [state, bounds] of Object.entries(STATE_BOUNDS)) {
      const latInRange = lat >= bounds.latMin && lat <= bounds.latMax;
      const lngInRange = lng >= bounds.lngMin && lng <= bounds.lngMax;
      
      if (latInRange && lngInRange) {
        return state;
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Gera pontos no mapa baseado nas coordenadas reais dos deals
 */
const generateMapPoints = (deals: DealPloomes[]): MapPoint[] => {
  // Agrupa deals por estado usando as coordenadas reais
  const stateCount: Record<string, number> = {};

  deals.forEach(deal => {
    if (deal.coordenadas) {
      const state = coordinatesToState(deal.coordenadas);
      if (state) {
        stateCount[state] = (stateCount[state] || 0) + 1;
      }
    }
  });

  // Converte para array de MapPoints
  return Object.entries(stateCount)
    .map(([state, volume], idx) => ({
      id: `${idx + 1}`,
      state,
      x: STATE_COORDINATES[state]?.x || 50,
      y: STATE_COORDINATES[state]?.y || 50,
      volume,
    }))
    .sort((a, b) => b.volume - a.volume); // Ordena por volume decrescente
};

/**
 * Gera pontos de calor individuais para cada deal com coordenadas
 * Usado para criar mapa de calor detalhado dentro dos estados
 */
const generateHeatPoints = (deals: DealPloomes[]): HeatPoint[] => {
  const heatPoints: HeatPoint[] = [];

  deals.forEach((deal, idx) => {
    if (deal.coordenadas) {
      try {
        const [latStr, lngStr] = deal.coordenadas.split(',').map(s => s.trim());
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (!isNaN(lat) && !isNaN(lng)) {
          heatPoints.push({
            id: `heat-${deal.id_deal || deal.id}-${idx}`,
            lat,
            lng,
          });
        }
      } catch {
        // Ignora coordenadas inválidas
      }
    }
  });

  return heatPoints;
};

// Constantes de meta de faturamento anual
const MARCO_6M = 6_000_000;  // 11% da meta
const MARCO_9M = 9_000_000;  // 50% da meta
const MARCO_12M = 12_000_000; // 100% da meta

/**
 * Busca o faturamento total do ano
 */
const fetchYearlyRevenue = async (year: number): Promise<number> => {
  const { data, error } = await supabase
    .from('deals_ploomes')
    .select('valor_faturamento')
    .gte('finish_date', `${year}-01-01`)
    .lt('finish_date', `${year + 1}-01-01`)
    .not('valor_faturamento', 'is', null) as { data: { valor_faturamento: number | null }[] | null; error: unknown };

  if (error) {
    console.error('Erro ao buscar faturamento:', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  return data.reduce((sum, d) => sum + (d.valor_faturamento ?? 0), 0);
};

/**
 * Calcula o progresso da meta de faturamento (linear)
 * Meta total: R$ 12M (100%)
 * Marcos visuais nas posições: 11%, 50%, 100%
 */
const calculateRevenueGrowth = (totalRevenue: number) => {
  // Cálculo linear: porcentagem = (faturado / meta) * 100
  const percentage = (totalRevenue / MARCO_12M) * 100;

  return {
    current: Math.round(percentage * 10) / 10, // Uma casa decimal
    totalRevenue,
    targets: [11, 50, 100], // Posições dos marcos na barra (correspondem aos labels)
    targetValues: [MARCO_6M, MARCO_9M, MARCO_12M],
  };
};

/**
 * Busca dados completos do dashboard geral
 */
export const fetchGeneralDashboardData = async (filter?: DashboardFilter): Promise<GeneralDashboardData> => {
  // Busca dados em paralelo para melhor performance
  // - Deals: filtrados por finish_date (mês de finalização) - afeta mapa e tempos
  // - Pendências: sempre TODAS (não filtrado por mês)
  // - Casos de Vistoria: sempre TODOS (não filtrado por mês) - área "Em Atraso"
  const [deals, pendencias, casosVistoria] = await Promise.all([
    fetchDeals(filter), // Filtrado por finish_date
    fetchPendenciasEngenharia(), // Sem filtro
    fetchCasosVistoria(), // Sem filtro - Em Atraso sempre mostra todos
  ]);
  
  // Busca faturamento do ano selecionado (ou ano atual)
  const year = filter?.year ?? new Date().getFullYear();
  const totalRevenue = await fetchYearlyRevenue(year);

  return {
    mapPoints: generateMapPoints(deals),
    heatPoints: generateHeatPoints(deals), // Pontos individuais para mapa de calor detalhado
    timeMetrics: calculateTimeMetrics(deals),
    tickets: {
      delayed: getDelayedFromCasosVistoria(casosVistoria), // Casos com data_vistoria > 48h
      pending: getPendenciasAsTickets(pendencias),
    },
    revenue: calculateRevenueGrowth(totalRevenue),
  };
};
