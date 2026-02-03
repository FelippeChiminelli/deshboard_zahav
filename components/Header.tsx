import React from 'react';
import { Menu, Calendar } from 'lucide-react';
import { DashboardFilter } from '../types';

interface HeaderProps {
  toggleSidebar: () => void;
  title: string;
  filter: DashboardFilter;
  setFilter: (f: DashboardFilter) => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, title, filter, setFilter }) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Gera lista de anos dinamicamente (do atual até 3 anos atrás)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i).reverse();

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, month: parseInt(e.target.value) });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, year: parseInt(e.target.value) });
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-slate-100 lg:hidden mr-4"
        >
          <Menu className="w-6 h-6 text-slate-600" />
        </button>
        <img 
          src="/logo/logo-zahav.jpeg" 
          alt="Logo ZAHAV" 
          className="h-8 mr-4"
        />
        <h2 className="text-xl font-semibold truncate" style={{ color: '#000000' }}>{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <div className="flex items-center px-2 text-slate-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Período:</span>
          </div>
          
          <select 
            value={filter.month} 
            onChange={handleMonthChange}
            className="bg-transparent text-sm font-medium py-1 px-2 rounded hover:bg-white focus:outline-none cursor-pointer"
            style={{ color: '#000000' }}
          >
            {months.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <div className="w-px h-4 bg-slate-300 mx-1"></div>

          <select 
            value={filter.year}
            onChange={handleYearChange}
            className="bg-transparent text-sm font-medium py-1 px-2 rounded hover:bg-white focus:outline-none cursor-pointer"
            style={{ color: '#000000' }}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
