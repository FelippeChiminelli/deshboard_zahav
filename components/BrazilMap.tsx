import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import Brazil from '@react-map/brazil';
import { MapPoint, HeatPoint } from '../types';

interface BrazilMapProps {
  points: MapPoint[];
  heatPoints?: HeatPoint[];
}

// Cores do tema
const COLORS = {
  primary: '#0810A6',
  primaryLight: '#2a32c4',
  primaryLighter: '#4a52d4',
  dark: '#142430',
  white: '#FFFFFF',
  black: '#000000',
};

// Escala de cores para o mapa de calor (do mais frio para o mais quente)
// Usando cores mais contrastantes para melhor visualização
const HEAT_COLORS = [
  '#f8fafc', // Cinza muito claro - sem dados
  '#e0f2fe', // Azul céu claro
  '#7dd3fc', // Azul céu
  '#38bdf8', // Azul turquesa
  '#0ea5e9', // Azul cyan
  '#0284c7', // Azul médio
  '#0369a1', // Azul forte
  '#075985', // Azul escuro
  '#0c4a6e', // Azul muito escuro
  '#0810A6', // Azul primário (mais intenso)
];

/**
 * Interpola cor baseado na intensidade (0-1) com curva logarítmica
 * para destacar melhor as diferenças
 */
const getHeatColor = (intensity: number): string => {
  if (intensity <= 0) return HEAT_COLORS[0];
  if (intensity >= 1) return HEAT_COLORS[HEAT_COLORS.length - 1];
  
  // Aplica curva para destacar valores menores
  const adjustedIntensity = Math.pow(intensity, 0.5);
  const index = Math.floor(adjustedIntensity * (HEAT_COLORS.length - 1));
  return HEAT_COLORS[Math.min(index + 1, HEAT_COLORS.length - 1)]; // +1 para pular o cinza
};

// Mapeamento de códigos de estado para nomes completos
const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins',
};

// Coordenadas dos centros dos estados no SVG do @react-map/brazil (viewBox ~0 0 612 639)
// Ajustadas para posicionamento preciso sobre cada estado
const STATE_SVG_COORDS: Record<string, { x: number; y: number }> = {
  // Norte
  'RR': { x: 200, y: 60 },
  'AP': { x: 350, y: 65 },
  'AM': { x: 165, y: 160 },
  'PA': { x: 340, y: 165 },
  'AC': { x: 68, y: 235 },
  'RO': { x: 180, y: 265 },
  'TO': { x: 400, y: 270 },
  // Nordeste
  'MA': { x: 450, y: 165 },
  'PI': { x: 505, y: 195 },
  'CE': { x: 545, y: 165 },
  'RN': { x: 595, y: 170 },
  'PB': { x: 585, y: 195 },
  'PE': { x: 575, y: 210 },
  'AL': { x: 595, y: 232 },
  'SE': { x: 585, y: 245 },
  'BA': { x: 520, y: 290 },
  // Centro-Oeste
  'MT': { x: 265, y: 305 },
  'GO': { x: 375, y: 340 },
  'DF': { x: 415, y: 327 },
  'MS': { x: 315, y: 415 },
  // Sudeste
  'MG': { x: 460, y: 390 },
  'ES': { x: 520, y: 400 },
  'RJ': { x: 490, y: 440 },
  'SP': { x: 385, y: 435 },
  // Sul
  'PR': { x: 365, y: 480 },
  'SC': { x: 375, y: 520 },
  'RS': { x: 330, y: 565 },
};

/** Mesma proporção do SVG do @react-map/brazil (overlay / size da lib). */
const MAP_VB_W = 612;
const MAP_VB_H = 639;

/**
 * Largura em px que cabe no retângulo (maxW × maxH) mantendo o aspecto do mapa.
 * size da lib = largura; altura renderizada ≈ size × (MAP_VB_H / MAP_VB_W).
 */
const fitMapWidthToBox = (maxW: number, maxH: number): number => {
  if (maxW <= 0 || maxH <= 0) return 200;
  const byWidth = maxW;
  const byHeight = maxH * (MAP_VB_W / MAP_VB_H);
  return Math.floor(Math.min(byWidth, byHeight));
};

// Converte coordenadas SVG para % do overlay (viewBox 0 0 612 639, meet em container quadrado)
const svgToPercent = (x: number, y: number): { top: number; left: number } => {
  const VB_WIDTH = MAP_VB_W;
  const VB_HEIGHT = MAP_VB_H;
  const renderedWidthPct = (VB_WIDTH / VB_HEIGHT) * 100;
  const marginLeftPct = (100 - renderedWidthPct) / 2;
  return {
    left: marginLeftPct + (x / VB_WIDTH) * renderedWidthPct,
    top: (y / VB_HEIGHT) * 100,
  };
};

// Limites geográficos do Brasil para conversão lat/lng -> posição no mapa
const BRAZIL_BOUNDS = {
  latMin: -33.75,  // Sul (RS)
  latMax: 5.27,    // Norte (RR)
  lngMin: -73.99,  // Oeste (AC)
  lngMax: -34.79,  // Leste (PB)
};

// Converte coordenadas geográficas (lat, lng) para posição no SVG
const geoToSvgPosition = (lat: number, lng: number): { x: number; y: number } | null => {
  // Verifica se está dentro dos limites do Brasil
  if (lat < BRAZIL_BOUNDS.latMin || lat > BRAZIL_BOUNDS.latMax ||
      lng < BRAZIL_BOUNDS.lngMin || lng > BRAZIL_BOUNDS.lngMax) {
    return null;
  }
  
  // Normaliza para 0-1
  const normalizedLng = (lng - BRAZIL_BOUNDS.lngMin) / (BRAZIL_BOUNDS.lngMax - BRAZIL_BOUNDS.lngMin);
  const normalizedLat = (BRAZIL_BOUNDS.latMax - lat) / (BRAZIL_BOUNDS.latMax - BRAZIL_BOUNDS.latMin);
  
  // Converte para coordenadas do SVG (viewBox 0 0 612 639)
  const VB_WIDTH = MAP_VB_W;
  const VB_HEIGHT = MAP_VB_H;

  return {
    x: normalizedLng * VB_WIDTH * 0.85 + VB_WIDTH * 0.08,  // Ajuste horizontal
    y: normalizedLat * VB_HEIGHT * 0.92 + VB_HEIGHT * 0.02, // Ajuste vertical
  };
};

const BrazilMap: React.FC<BrazilMapProps> = ({ points, heatPoints = [] }) => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const mapAreaRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState(320);

  useLayoutEffect(() => {
    const el = mapAreaRef.current;
    if (!el) return;

    const update = () => {
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const w = el.clientWidth - padX;
      const h = el.clientHeight - padY;
      if (w < 8 || h < 8) return;
      const next = fitMapWidthToBox(w, h);
      setMapSize(Math.max(100, Math.min(next, 900)));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getStateVolume = (stateCode: string): number => {
    const point = points.find(p => p.state === stateCode);
    return point?.volume || 0;
  };

  /** A lib @react-map/brazil usa nome completo no onSelect; dados usam sigla UF. */
  const handleSelect = (stateFromMap: string | null) => {
    if (stateFromMap == null) {
      setSelectedState(null);
      return;
    }
    const uf = Object.entries(STATE_NAMES).find(([, name]) => name === stateFromMap)?.[0];
    if (uf) {
      setSelectedState(uf);
      return;
    }
    if (STATE_NAMES[stateFromMap]) {
      setSelectedState(stateFromMap);
    }
  };

  const totalProjects = points.reduce((sum, p) => sum + p.volume, 0);
  const sortedPoints = [...points].filter(p => p.volume > 0).sort((a, b) => b.volume - a.volume);
  const maxVolume = sortedPoints[0]?.volume || 1;

  // Gera os dados do mapa de calor para cada estado
  const heatMapData = useMemo(() => {
    const data: Record<string, string> = {};
    
    Object.keys(STATE_NAMES).forEach(state => {
      const volume = getStateVolume(state);
      const intensity = maxVolume > 0 ? volume / maxVolume : 0;
      data[state] = getHeatColor(intensity);
    });
    
    return data;
  }, [points, maxVolume]);

  /** Chaves = nome completo do estado, como em @react-map/brazil (restaura fill após hover). */
  const cityColors = useMemo(() => {
    const record: Record<string, string> = {};
    Object.entries(STATE_NAMES).forEach(([uf, fullName]) => {
      record[fullName] = heatMapData[uf];
    });
    return record;
  }, [heatMapData]);

  const getBarColor = (index: number): string => {
    if (index === 0) return COLORS.primary;
    if (index === 1) return COLORS.primaryLight;
    if (index === 2) return COLORS.primaryLighter;
    return '#cbd5e1';
  };

  return (
    <div className="h-full min-h-0 min-w-0 flex flex-col overflow-x-hidden">
      {/* Header compacto */}
      <div className="px-3 py-2 border-b border-slate-100 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-sm" style={{ color: COLORS.black }}>Distribuição Geográfica</h4>
            <p className="text-[10px] text-slate-400">Mapa de calor por volume de atendimentos</p>
          </div>
          {/* Legenda do mapa de calor */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[8px] text-slate-400 uppercase">Intensidade</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] text-slate-400">-</span>
              <div className="flex h-2 rounded-sm overflow-hidden">
                {HEAT_COLORS.slice(1).map((color, idx) => (
                  <div 
                    key={idx} 
                    className="w-2.5 h-full" 
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-[8px] text-slate-400">+</span>
            </div>
          </div>
        </div>
      </div>


      {/* Mapa: ResizeObserver mede a área; size encaixa largura e altura (sem scroll) */}
      <div
        ref={mapAreaRef}
        className="flex-1 min-h-0 min-w-0 overflow-hidden p-1 flex items-center justify-center"
      >
        <div
          className="relative brazil-map shrink-0 max-w-full"
          style={{ width: mapSize }}
        >
          <Brazil
            type="select-single"
            size={mapSize}
            mapColor="#f1f5f9"
            strokeColor="#94a3b8"
            strokeWidth={0.5}
            hoverColor="#a5b4fc"
            selectColor={COLORS.primary}
            cityColors={cityColors}
            disableHover
            hints={true}
            hintTextColor={COLORS.black}
            hintBackgroundColor={COLORS.white}
            hintPadding="4px 8px"
            hintBorderRadius={4}
            onSelect={handleSelect}
          />
          
          {/* Siglas dos estados posicionadas no mapa */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
            {Object.entries(STATE_SVG_COORDS).map(([state, coords]) => {
              const position = svgToPercent(coords.x, coords.y);
              const volume = getStateVolume(state);
              const hasData = volume > 0;
              const textColor = hasData ? '#1e3a5f' : '#94a3b8';
              
              return (
                <span
                  key={state}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 font-bold"
                  style={{
                    top: `${position.top}%`,
                    left: `${position.left}%`,
                    fontSize: '8px',
                    color: textColor,
                    textShadow: hasData ? '0 0 2px rgba(255,255,255,0.8)' : 'none',
                  }}
                >
                  {state}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estado selecionado */}
      {selectedState && (
        <div 
          className="mx-3 mb-2 p-2 rounded-lg border shrink-0"
          style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold" style={{ color: COLORS.primary }}>
              {STATE_NAMES[selectedState]} ({selectedState})
            </span>
            <div>
              <span className="text-sm font-bold" style={{ color: COLORS.primary }}>{getStateVolume(selectedState)}</span>
              <span className="text-[10px] ml-1" style={{ color: COLORS.primaryLight }}>
                ({((getStateVolume(selectedState) / totalProjects) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ranking compacto - Grid */}
      <div className="px-3 pb-3 shrink-0">
        <h5 className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wide">Top Estados</h5>
        
        <div className="grid grid-cols-5 gap-1.5">
          {sortedPoints.slice(0, 10).map((point, index) => {
            const percentage = (point.volume / maxVolume) * 100;
            const isSelected = selectedState === point.state;
            
            return (
              <div 
                key={point.id} 
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
                  boxShadow: isSelected ? `0 0 0 1px ${COLORS.primaryLight}` : 'none',
                }}
                onClick={() => setSelectedState(point.state)}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{
                      backgroundColor: index < 3 ? COLORS.primary : '#e2e8f0',
                      color: index < 3 ? COLORS.white : '#64748b',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: COLORS.black }}>{point.state}</span>
                </div>
                
                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ width: `${percentage}%`, backgroundColor: getBarColor(index) }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {sortedPoints.length > 10 && (
          <p className="text-[9px] text-slate-400 mt-1.5 text-center">
            +{sortedPoints.length - 10} estados
          </p>
        )}
      </div>
    </div>
  );
};

export default BrazilMap;
