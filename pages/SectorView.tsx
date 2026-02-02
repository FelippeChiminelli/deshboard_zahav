import React from 'react';
import { Sector, DashboardFilter } from '../types';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectorViewProps {
  sector: Sector;
  filter: DashboardFilter;
}

const getSectorTitle = (s: Sector) => {
  switch(s) {
    case Sector.VISTORIAS: return 'Vistorias Técnicas';
    case Sector.CADASTRO: return 'Setor de Cadastro';
    case Sector.OPERACOES: return 'Gestão de Operações';
    case Sector.ELABORACAO: return 'Analista de Elaboração';
    case Sector.PRECIFICACAO: return 'Analista de Precificação';
    case Sector.ENGENHARIA: return 'Gestão de Engenharia';
    default: return 'Setor';
  }
};

const getSectorDescription = (s: Sector) => {
  switch(s) {
    case Sector.VISTORIAS: 
      return 'Acompanhamento de vistorias técnicas, orçamento vs realizado e novos vistoriadores.';
    case Sector.CADASTRO: 
      return 'Métricas de tempo de resposta (WhatsApp/Email) e volume de cadastros.';
    case Sector.OPERACOES: 
      return 'Gestão de tempo total, taxa de cancelamento e retenção de clientes.';
    case Sector.ELABORACAO: 
      return 'Produtividade de elaboração, taxa de erros e prazo de processo.';
    case Sector.PRECIFICACAO: 
      return 'Volume de precificações, tempo de entrega e questionamentos.';
    case Sector.ENGENHARIA: 
      return 'Laudos no prazo, pendências e tempo de resposta.';
    default: 
      return 'Métricas e indicadores do setor.';
  }
};

const SectorView: React.FC<SectorViewProps> = ({ sector, filter }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{getSectorTitle(sector)}</h2>
          <p className="text-slate-500 text-sm mt-1">
            Período selecionado: {filter.month + 1}/{filter.year}
          </p>
        </div>
        <Link 
          to="/" 
          className="mt-4 md:mt-0 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard Geral
        </Link>
      </div>

      {/* Em Desenvolvimento */}
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-12 max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
            <Construction className="w-10 h-10 text-amber-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            Setor em Desenvolvimento
          </h3>
          
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {getSectorDescription(sector)}
          </p>

          <div className="bg-white rounded-lg p-4 border border-amber-100 mb-6">
            <p className="text-sm text-slate-500">
              Os dados específicos deste setor ainda não estão integrados ao Supabase. 
              Atualmente, apenas o <strong>Dashboard Geral</strong> está conectado aos dados reais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver Dashboard Geral
            </Link>
          </div>
        </div>
      </div>

      {/* Info sobre próximos passos */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
        <strong>Próximos passos:</strong> Para habilitar este setor, será necessário criar as tabelas 
        correspondentes no Supabase e configurar a integração de dados específica para {getSectorTitle(sector)}.
      </div>
    </div>
  );
};

export default SectorView;
