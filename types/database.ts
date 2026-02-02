// Tipos gerados a partir do schema do Supabase
export interface Database {
  public: {
    Tables: {
      deals_ploomes: {
        Row: {
          id: number;
          created_at: string;
          id_deal: number | null;
          start_date: string | null;
          finish_date: string | null;
          fim_operacoes: string | null;
          fim_engenharia: string | null;
          valor_faturamento: number | null;
          coordenadas: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          start_date?: string | null;
          finish_date?: string | null;
          fim_operacoes?: string | null;
          fim_engenharia?: string | null;
          valor_faturamento?: number | null;
          coordenadas?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          start_date?: string | null;
          finish_date?: string | null;
          fim_operacoes?: string | null;
          fim_engenharia?: string | null;
          valor_faturamento?: number | null;
          coordenadas?: string | null;
        };
      };
      pendencias_engenharia: {
        Row: {
          id: number;
          created_at: string;
          id_deal: number | null;
          title: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          title?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          title?: string | null;
        };
      };
      casos_vistoria: {
        Row: {
          id: number;
          created_at: string;
          id_deal: number | null;
          start_date: string | null;
          title: string | null;
          data_vistoria: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          start_date?: string | null;
          title?: string | null;
          data_vistoria?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          start_date?: string | null;
          title?: string | null;
          data_vistoria?: string | null;
        };
      };
    };
  };
}

// Tipos auxiliares
export type DealPloomes = Database['public']['Tables']['deals_ploomes']['Row'];
export type PendenciaEngenharia = Database['public']['Tables']['pendencias_engenharia']['Row'];
export type CasoVistoria = Database['public']['Tables']['casos_vistoria']['Row'];
