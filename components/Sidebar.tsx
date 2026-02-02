import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Users, 
  Settings, 
  FileText, 
  DollarSign, 
  HardHat, 
  LayoutDashboard,
  Tv,
  Copy,
  Check
} from 'lucide-react';
import { Sector } from '../types';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [copied, setCopied] = useState(false);

  const copyTVLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const tvLink = `${baseUrl}#/tv`;
    navigator.clipboard.writeText(tvLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const menuItems = [
    { name: 'Dashboard Geral', icon: LayoutDashboard, path: '/' },
    { name: 'Vistorias', icon: ClipboardCheck, path: `/${Sector.VISTORIAS}` },
    { name: 'Cadastro', icon: Users, path: `/${Sector.CADASTRO}` },
    { name: 'Gestão Operações', icon: Settings, path: `/${Sector.OPERACOES}` },
    { name: 'Análise Elaboração', icon: FileText, path: `/${Sector.ELABORACAO}` },
    { name: 'Análise Precificação', icon: DollarSign, path: `/${Sector.PRECIFICACAO}` },
    { name: 'Gestão Engenharia', icon: HardHat, path: `/${Sector.ENGENHARIA}` },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 text-white transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-auto
        `}
        style={{ backgroundColor: '#142430' }}
      >
        <div 
          className="flex items-center justify-center h-16 shadow-md"
          style={{ backgroundColor: '#0c1a24' }}
        >
          <h1 className="text-xl font-bold tracking-wider" style={{ color: '#0810A6' }}>INDICADORES</h1>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => { if(window.innerWidth < 1024) toggleSidebar() }}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'text-white shadow-lg' 
                  : 'text-slate-300 hover:text-white'}
              `}
              style={({ isActive }) => isActive ? { backgroundColor: '#0810A6' } : { }}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t" style={{ borderColor: '#1e3a4d' }}>
          {/* Botão para copiar link do modo TV */}
          <button
            onClick={copyTVLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-3 rounded-lg text-sm font-medium transition-all"
            style={{ 
              backgroundColor: copied ? '#059669' : '#1e3a4d',
              color: '#fff'
            }}
          >
            <Tv className="w-4 h-4" />
            <span>{copied ? 'Link copiado!' : 'Copiar link para TV'}</span>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <div className="text-xs text-slate-500 text-center">
            &copy; 2024 Gestão Integrada
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
