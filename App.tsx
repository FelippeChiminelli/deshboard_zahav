import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SectorView from './pages/SectorView';
import DashboardHome from './pages/DashboardHome';
import { Sector, DashboardFilter } from './types';

// Componente para o layout principal com sidebar
const MainLayout: React.FC<{
  filter: DashboardFilter;
  setFilter: React.Dispatch<React.SetStateAction<DashboardFilter>>;
}> = ({ filter, setFilter }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={toggleSidebar} 
          title="Dashboard de Gestão" 
          filter={filter}
          setFilter={setFilter}
        />

        <main className="flex-1 overflow-hidden p-4">
          <div className="h-full">
            <Routes>
              <Route path="/" element={<DashboardHome filter={filter} />} />
              
              {/* Routes for each sector */}
              <Route path={`/${Sector.VISTORIAS}`} element={<SectorView sector={Sector.VISTORIAS} filter={filter} />} />
              <Route path={`/${Sector.CADASTRO}`} element={<SectorView sector={Sector.CADASTRO} filter={filter} />} />
              <Route path={`/${Sector.OPERACOES}`} element={<SectorView sector={Sector.OPERACOES} filter={filter} />} />
              <Route path={`/${Sector.ELABORACAO}`} element={<SectorView sector={Sector.ELABORACAO} filter={filter} />} />
              <Route path={`/${Sector.PRECIFICACAO}`} element={<SectorView sector={Sector.PRECIFICACAO} filter={filter} />} />
              <Route path={`/${Sector.ENGENHARIA}`} element={<SectorView sector={Sector.ENGENHARIA} filter={filter} />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente para o modo TV (sem sidebar e header)
const TVLayout: React.FC<{ 
  filter: DashboardFilter;
  setFilter: React.Dispatch<React.SetStateAction<DashboardFilter>>;
}> = ({ filter, setFilter }) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="h-screen bg-slate-50 overflow-hidden p-4 flex flex-col">
      {/* Header compacto para TV com logo e seletor de período */}
      <div className="flex justify-between items-center mb-2 shrink-0">
        <img 
          src="/logo/Logo Primária Azul.svg" 
          alt="Logo" 
          className="h-10"
        />
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
          <span className="text-xs text-slate-500">Período:</span>
          <select
            value={filter.month}
            onChange={(e) => setFilter(prev => ({ ...prev, month: parseInt(e.target.value) }))}
            className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx}>{month}</option>
            ))}
          </select>
          <select
            value={filter.year}
            onChange={(e) => setFilter(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            className="text-sm font-medium text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Dashboard */}
      <div className="flex-1 overflow-hidden">
        <DashboardHome filter={filter} />
      </div>
    </div>
  );
};

// Componente principal que decide qual layout usar
const AppContent: React.FC = () => {
  const location = useLocation();
  const [filter, setFilter] = useState<DashboardFilter>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  // Verifica se está na rota TV
  const isTVMode = location.pathname === '/tv';

  if (isTVMode) {
    return <TVLayout filter={filter} setFilter={setFilter} />;
  }

  return <MainLayout filter={filter} setFilter={setFilter} />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/tv" element={<AppContent />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </HashRouter>
  );
};

export default App;