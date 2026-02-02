export enum Sector {
  VISTORIAS = 'vistorias',
  CADASTRO = 'cadastro',
  OPERACOES = 'operacoes',
  ELABORACAO = 'elaboracao',
  PRECIFICACAO = 'precificacao',
  ENGENHARIA = 'engenharia',
}

export interface DashboardFilter {
  month: number; // 0-11
  year: number;
}

export interface KPIData {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

// Specific data structures for charts
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface SectorData {
  kpis: KPIData[];
  charts: {
    mainChart: ChartDataPoint[];
    secondaryChart?: ChartDataPoint[];
  };
  valueGained: {
    current: number;
    max: number;
  };
}

// TV Dashboard Types
export interface MapPoint {
  id: string;
  state: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  volume: number;
}

// Ponto de calor individual com coordenadas geográficas
export interface HeatPoint {
  id: string;
  lat: number;
  lng: number;
}

export interface TicketAlert {
  id: string;
  client: string;
  info: string; // Days late or Pending reason
  status: 'delayed' | 'pending';
}

export interface GeneralDashboardData {
  mapPoints: MapPoint[];
  heatPoints: HeatPoint[];     // Pontos individuais para mapa de calor detalhado
  timeMetrics: {
    total: number;
    operations: number;
    engineering: number;
  };
  tickets: {
    delayed: TicketAlert[];
    pending: TicketAlert[];
  };
  revenue: {
    current: number;           // Porcentagem de atingimento da meta
    totalRevenue: number;      // Valor total faturado no ano
    targets: number[];         // Marcos percentuais [11, 50, 100]
    targetValues: number[];    // Valores em reais [6M, 9M, 12M]
  };
}