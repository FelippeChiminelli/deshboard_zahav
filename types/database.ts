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
      deals_orcadoxrealizado: {
        Row: {
          id: number;
          created_at: string;
          id_deal: number | null;
          valor_orcado: number | null;
          valor_realizado: number | null;
          nome_vistoriador: string | null;
          title: string | null;
          tipo_bem: string | null;
          id_vistoriador: string | null;
          tipo_vistoriador: string | null;
          start_date_ploomes: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          valor_orcado?: number | null;
          valor_realizado?: number | null;
          nome_vistoriador?: string | null;
          title?: string | null;
          tipo_bem?: string | null;
          id_vistoriador?: string | null;
          tipo_vistoriador?: string | null;
          start_date_ploomes?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          id_deal?: number | null;
          valor_orcado?: number | null;
          valor_realizado?: number | null;
          nome_vistoriador?: string | null;
          title?: string | null;
          tipo_bem?: string | null;
          id_vistoriador?: string | null;
          tipo_vistoriador?: string | null;
          start_date_ploomes?: string | null;
        };
      };
      vistoriadores: {
        Row: {
          id: number;
          created_at: string;
          nome: string | null;
          id_ploomes: string | null;
          data_criacao: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          nome?: string | null;
          id_ploomes?: string | null;
          data_criacao?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          nome?: string | null;
          id_ploomes?: string | null;
          data_criacao?: string | null;
        };
      };
    };
  };
}

// Tipos auxiliares
export type DealPloomes = Database['public']['Tables']['deals_ploomes']['Row'];
export type PendenciaEngenharia = Database['public']['Tables']['pendencias_engenharia']['Row'];
export type CasoVistoria = Database['public']['Tables']['casos_vistoria']['Row'];
export type DealOrcadoRealizado = Database['public']['Tables']['deals_orcadoxrealizado']['Row'];
export type Vistoriador = Database['public']['Tables']['vistoriadores']['Row'];
