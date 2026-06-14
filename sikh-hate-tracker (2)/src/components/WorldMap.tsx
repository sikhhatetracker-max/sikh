import React, { useState, useEffect, useRef } from 'react';
import { Incident } from '../types';
import { MapPin, Globe, AlertTriangle, ShieldCheck, HelpCircle, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import * as topojson from 'topojson-client';

interface WorldMapProps {
  incidents: Incident[];
  onSelectCountry: (country: string | null) => void;
  selectedCountry: string | null;
}

// Convert coordinates (lat, lon) to SVG space (800 x 400 space)
// Standard Equirectangular Projection
const convertCoords = (lat: number, lon: number, width: number, height: number) => {
  // x ranges from -180 to 180 -> 0 to width
  const x = ((lon + 180) * width) / 360;
  // y ranges from 90 to -90 -> 0 to height
  const y = ((90 - lat) * height) / 180;
  return { x, y };
};

// Numerical ISO-3166 codes to english names mapping
const countryMap: Record<number, string> = {
  124: "Canada",
  840: "United States",
  826: "United Kingdom",
  356: "India",
  36: "Australia",
  380: "Italy",
  276: "Germany",
  586: "Pakistan",
  4: "Afghanistan",
  554: "New Zealand",
};

export default function WorldMap({ incidents, onSelectCountry, selectedCountry }: WorldMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredIncident, setHoveredIncident] = useState<Incident | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // GeoJSON features state
  const [geoFeatures, setGeoFeatures] = useState<any[] | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(true);

  // Zoom and Pan states for premium navigation interactivity
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const mapWidth = 800;
  const mapHeight = 400; // standard 2:1 projection aspect ratio for high accuracy

  // Fetch and decode high fidelity world coordinates
  useEffect(() => {
    let active = true;
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => {
        if (!res.ok) throw new Error('Unreachable atlas data');
        return res.json();
      })
      .then(topology => {
        if (active) {
          const geojson = topojson.feature(topology, topology.objects.countries) as any;
          setGeoFeatures(geojson.features || null);
          setLoadingGeo(false);
        }
      })
      .catch(err => {
        console.error('Atlas database fetch error, utilizing fallback geometric pathways:', err);
        if (active) {
          setLoadingGeo(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Summarize the counts per country to display in the bento grid/legend
  const countryCounts = incidents.reduce((acc, curr) => {
    acc[curr.country] = (acc[curr.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const monitoredCountries = [
    { name: 'Canada', lat: 56.13, lon: -106.34 },
    { name: 'United States', lat: 37.09, lon: -95.71 },
    { name: 'United Kingdom', lat: 55.37, lon: -3.43 },
    { name: 'India', lat: 21.00, lon: 78.96 },
    { name: 'Australia', lat: -25.27, lon: 133.77 },
    { name: 'Italy', lat: 41.87, lon: 12.56 },
    { name: 'Germany', lat: 51.16, lon: 10.45 },
    { name: 'Pakistan', lat: 30.37, lon: 69.34 },
    { name: 'Afghanistan', lat: 33.93, lon: 67.70 },
    { name: 'New Zealand', lat: -40.90, lon: 174.88 },
  ];

  // Helper mapping numeric ID to name
  const getCountryNameById = (id: string | number): string | null => {
    const numId = typeof id === 'string' ? parseInt(id, 10) : Number(id);
    return countryMap[numId] || null;
  };

  const handleCountryClick = (countryName: string) => {
    if (selectedCountry === countryName) {
      onSelectCountry(null);
    } else {
      onSelectCountry(countryName);
    }
  };

  // Turn geographic geometry polygons into highly accurate SVG paths
  const getSvgPath = (geometry: any): string => {
    if (!geometry) return '';
    const { type, coordinates } = geometry;

    if (type === 'Polygon') {
      return coordinates
        .map((ring: any) => {
          return ring
            .map((coord: [number, number], index: number) => {
              const { x, y } = convertCoords(coord[1], coord[0], mapWidth, mapHeight);
              return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ') + ' Z';
        })
        .join(' ');
    } else if (type === 'MultiPolygon') {
      return coordinates
        .map((polygon: any) => {
          return polygon
            .map((ring: any) => {
              return ring
                .map((coord: [number, number], index: number) => {
                  const { x, y } = convertCoords(coord[1], coord[0], mapWidth, mapHeight);
                  return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                })
                .join(' ') + ' Z';
            })
            .join(' ');
        })
        .join(' ');
    }
    return '';
  };

  // Drag controls for pan
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // only left click Drag
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Boundary constraints for smooth view controls
    const maxPanX = Math.max(0, (zoom - 1) * mapWidth);
    const maxPanY = Math.max(0, (zoom - 1) * mapHeight);

    setPan({
      x: Math.max(-maxPanX, Math.min(0, newX)),
      y: Math.max(-maxPanY, Math.min(0, newY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(6, prev + 0.5));
  };

  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Floating HTML absolute tooltip triggers
  const handlePinMouseMove = (e: React.MouseEvent, inc: Incident) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredIncident(inc);
  };

  const handlePinMouseLeave = () => {
    setHoveredIncident(null);
  };

  return (
    <div 
      id="world_map_card" 
      ref={containerRef}
      className="bg-white border border-neutral-200 rounded-3xl p-6 relative overflow-hidden text-neutral-800 shadow-xl transition-all duration-350"
    >
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-650"></span>
            </span>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#991b1b]">
              HIGH-FIDELITY TRACKING CONSOLE
            </h3>
          </div>
          <h2 className="text-lg font-black text-neutral-950 tracking-tight leading-none uppercase">
            Geographical Incident Map
          </h2>
          <p className="text-[11px] text-neutral-500 mt-1 font-semibold leading-relaxed">
            Drag to pan, scroll or utilize floating zoom widgets to explore hyper-accurate coordinates of recorded events.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {selectedCountry ? (
            <button
              onClick={() => onSelectCountry(null)}
              className="text-[10px] px-3.5 py-1.5 bg-red-50 text-red-650 border border-red-200 rounded-full hover:bg-neutral-950 hover:text-white transition-all cursor-pointer font-mono font-black shadow-sm uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>FILTER: {selectedCountry}</span>
              <span className="text-red-400 font-normal">×</span>
            </button>
          ) : (
            <span className="text-[10px] bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 font-mono font-bold uppercase tracking-wider shadow-sm">
              GLOBAL DISPLAY
            </span>
          )}
          <span className="text-[10px] bg-red-650 text-white px-3 py-1.5 rounded-full border border-red-700 font-mono font-black uppercase tracking-wider shadow-sm">
            {incidents.length} TOTAL REPORTS
          </span>
        </div>
      </div>

      {/* SVG Canvas Frame */}
      <div 
        id="world_map_container"
        className={`relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-inner border border-neutral-100 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ background: 'radial-gradient(circle at 50% 50%, #faffff 0%, #f3faf9 35%, #ebf4f5 70%, #dce4e6 100%)' }}
        >
          {/* Defs block configures shadow filtering & high stability overlays */}
          <defs>
            <filter id="clay-shadow" x="-5%" y="-5%" width="115%" height="115%">
              <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#334155" floodOpacity="0.06" />
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#475569" floodOpacity="0.04" />
            </filter>

            <filter id="beacon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.2 0" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <radialGradient id="highlight-aura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Graticule grid lines mapped statically behind geography */}
          <g stroke="#0891b2" strokeWidth="0.08" strokeDasharray="3 5" opacity="0.1">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`lon-${i}`} x1={(mapWidth / 12) * (i + 1)} y1="0" x2={(mapWidth / 12) * (i + 1)} y2={mapHeight} />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`lat-${i}`} x1="0" y1={(mapHeight / 8) * (i + 1)} x2={mapWidth} y2={(mapHeight / 8) * (i + 1)} />
            ))}
          </g>

          {/* Dynamic Transformation Group */}
          <g
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Highly Accurate Country Landmass Shapes rendered dynamically from JSDelivr World Atlas */}
            {geoFeatures ? (
              <g id="world_geographies" filter="url(#clay-shadow)">
                {geoFeatures.map((feat: any, idx: number) => {
                  const countryId = feat.id !== undefined && feat.id !== null ? feat.id : `fallback-${idx}`;
                  const countryName = getCountryNameById(countryId);
                  const isActive = countryName ? true : false;
                  const isSelected = selectedCountry === countryName;
                  const isHovered = hoveredCountry === countryName;
                  const count = countryName ? countryCounts[countryName] || 0 : 0;

                  // High-contrast, publication-grade styling
                  let fill = '#ffffff';
                  let stroke = '#cbd5e1';
                  let strokeWidth = 0.5;

                  if (isActive) {
                    if (isSelected) {
                      fill = '#fef2f2'; // Soft warm red highlight
                      stroke = '#b91c1c';
                      strokeWidth = 1.0;
                    } else if (isHovered) {
                      fill = '#f8fafc';
                      stroke = '#64748b';
                      strokeWidth = 0.8;
                    } else if (count > 0) {
                      fill = '#fff5f5'; // Light warning aura
                      stroke = '#f87171';
                      strokeWidth = 0.65;
                    } else {
                      fill = '#fafafa';
                      stroke = '#d4d4d4';
                      strokeWidth = 0.55;
                    }
                  }

                  return (
                    <path
                      key={`geo-${countryId}`}
                      d={getSvgPath(feat.geometry)}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth / Math.sqrt(zoom)}
                      onClick={() => countryName && handleCountryClick(countryName)}
                      onMouseEnter={() => countryName && setHoveredCountry(countryName)}
                      onMouseLeave={() => countryName && setHoveredCountry(null)}
                      className={`transition-all duration-200 ${
                        isActive ? 'cursor-pointer' : 'pointer-events-none opacity-85'
                      }`}
                    />
                  );
                })}
              </g>
            ) : (
              /* High quality stylized backup shapes rendering immediately if offline / loading */
              <g id="fallback_geographies" filter="url(#clay-shadow)">
                {/* Fallback North America */}
                <path
                  d="M 50 50 C 55 40, 75 25, 100 25 C 130 25, 150 15, 175 20 C 195 24, 215 35, 225 35 C 235 35, 248 45, 245 55 C 242 65, 222 70, 215 80 C 208 90, 218 100, 208 110 C 200 118, 190 110, 188 120 C 185 130, 175 140, 165 145 C 155 150, 142 165, 134 180 C 130 188, 122 188, 120 178 C 118 160, 124 145, 120 130 C 116 115, 102 115, 98 108 C 88 100, 78 105, 68 100 C 58 95, 48 80, 48 65 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Fallback South America */}
                <path
                  d="M 190 190 C 202 185, 218 198, 228 208 C 238 218, 248 228, 258 245 C 268 260, 258 280, 248 300 C 238 320, 228 340, 218 360 C 212 366, 204 362, 200 352 C 196 342, 190 325, 185 310 C 180 295, 178 275, 175 255 C 172 235, 170 215, 180 200 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Fallback Africa */}
                <path
                  d="M 330 170 C 345 155, 370 145, 390 148 C 410 150, 425 160, 435 170 C 445 180, 455 195, 458 210 C 460 225, 450 245, 442 260 C 435 275, 430 290, 420 302 C 412 310, 403 312, 398 305 C 392 295, 385 285, 380 270 C 375 255, 370 240, 362 225 C 354 210, 340 195, 332 185 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Fallback Europe/Asia */}
                <path
                  d="M 350 70 C 360 62, 375 55, 390 52 C 405 50, 418 55, 428 65 L 430 65 C 440 55, 470 42, 500 38 C 550 32, 620 35, 680 40 C 720 45, 750 50, 770 65 C 780 75, 765 95, 755 115 C 745 135, 760 155, 740 170 C 725 180, 710 165, 695 155 C 685 145, 670 148, 660 138 C 650 128, 640 138, 630 148 C 620 158, 615 170, 600 180 C 585 190, 565 170, 555 160 C 545 150, 532 155, 520 165 C 510 175, 492 185, 480 180 C 472 175, 475 165, 470 155 C 462 145, 452 135, 445 125 C 438 115, 395 138, 350 110 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
                {/* Fallback Australia */}
                <path
                  d="M 640 250 C 660 240, 690 245, 715 252 C 730 258, 735 272, 732 288 C 728 304, 715 315, 695 322 C 678 325, 660 315, 645 305 Z"
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                />
              </g>
            )}

            {/* Glowing Interactive Monitored Country Hotspot Overlays */}
            {monitoredCountries.map((c) => {
              const { x, y } = convertCoords(c.lat, c.lon, mapWidth, mapHeight);
              const count = countryCounts[c.name] || 0;
              const isSelected = selectedCountry === c.name;
              const isHovered = hoveredCountry === c.name;

              return (
                <g
                  key={`hotspot-bubble-${c.name}`}
                  onClick={() => handleCountryClick(c.name)}
                  onMouseEnter={() => setHoveredCountry(c.name)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  className="cursor-pointer"
                >
                  {/* Radial Highlight Aura */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={30 / Math.sqrt(zoom)}
                      fill="url(#highlight-aura)"
                    />
                  )}

                  {/* Pulsing ripple ring indicators */}
                  {count > 0 && (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r={(isSelected ? 18 : isHovered ? 14 : 9) / Math.sqrt(zoom)}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={1.5 / zoom}
                        strokeOpacity="0.4"
                        className="animate-ping"
                        style={{ animationDuration: isSelected ? '1.5s' : '2.8s' }}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={(isSelected ? 12 : isHovered ? 9 : 5.5) / Math.sqrt(zoom)}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={1.0 / zoom}
                        strokeOpacity="0.25"
                        className="animate-pulse"
                      />
                    </>
                  )}

                  {/* High durability central radar coordinate node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={(isSelected ? 6 : isHovered ? 5 : 3.5) / Math.sqrt(zoom)}
                    filter="url(#beacon-glow)"
                    className={`transition-all duration-300 ${
                      isSelected
                        ? 'fill-red-700 stroke-white'
                        : count > 0
                        ? 'fill-red-600 stroke-white'
                        : 'fill-neutral-400 stroke-white'
                    }`}
                    style={{ strokeWidth: (isSelected ? 1.5 : 1) / zoom }}
                  />

                  {/* Smart Mini Labels floating over zoomed regions */}
                  {(isHovered || isSelected) && (
                    <g transform={`translate(${x + 8 / zoom}, ${y - 8 / zoom})`}>
                      <rect
                        x="-3"
                        y="-10"
                        width={(c.name.length * 5.2 + 38) / Math.sqrt(zoom)}
                        height={14 / Math.sqrt(zoom)}
                        rx={4 / Math.sqrt(zoom)}
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke="#475569"
                        strokeWidth={0.5 / zoom}
                      />
                      <text
                        fill="#ffffff"
                        fontSize={8 / Math.sqrt(zoom)}
                        fontWeight="900"
                        fontFamily="monospace"
                        letterSpacing="0.3"
                        x={4 / zoom}
                        y={-1 / zoom}
                      >
                        {c.name.toUpperCase()} • {count}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Highly Accurate Positional Incident Plots */}
            {incidents
              .filter(inc => inc.latitude && inc.longitude)
              .map(inc => {
                // Generates subtle random offset to prevent point overlapping on exact coordinates
                const offsetAngle = (parseInt(inc.id.substring(0, 4), 16) || 0) % 360;
                const offsetRad = (offsetAngle * Math.PI) / 180;
                const perturbScale = 1.6;
                const perturbX = Math.cos(offsetRad) * perturbScale;
                const perturbY = Math.sin(offsetRad) * perturbScale;

                const { x, y } = convertCoords(inc.latitude, inc.longitude, mapWidth, mapHeight);

                return (
                  <g 
                    key={`pin-coord-group-${inc.id}`}
                    onMouseMove={(e) => handlePinMouseMove(e, inc)}
                    onMouseLeave={handlePinMouseLeave}
                    className="cursor-help"
                  >
                    {/* Oversized hover receptor bubble */}
                    <circle
                      cx={x + perturbX / zoom}
                      cy={y + perturbY / zoom}
                      r={7 / Math.sqrt(zoom)}
                      fill="#ef4444"
                      fillOpacity="0"
                      className="hover:fill-opacity-15 transition-all duration-150"
                    />

                    {/* Actual vector coordinate mark */}
                    <circle
                      cx={x + perturbX / zoom}
                      cy={y + perturbY / zoom}
                      r={2.2 / Math.sqrt(zoom)}
                      fill={inc.severity === 'high' ? '#991b1b' : inc.severity === 'medium' ? '#dc2626' : '#ef4444'}
                      stroke="#ffffff"
                      strokeWidth={0.4 / zoom}
                      className="hover:scale-125 transition-transform"
                    />
                  </g>
                );
              })}
          </g>
        </svg>

        {/* Floating Controller Widget Board (Zoom In / Zoom Out / Reset) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 backdrop-blur-md bg-white/80 p-1.5 rounded-xl border border-neutral-200/60 shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-1 px-1.5 bg-white hover:bg-neutral-950 hover:text-white border border-neutral-150 rounded-lg text-neutral-700 transition-all cursor-pointer font-bold text-xs flex items-center justify-center gap-1"
            title="Increase Zoom Level"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1 px-1.5 bg-white hover:bg-neutral-950 hover:text-white border border-neutral-150 rounded-lg text-neutral-700 transition-all cursor-pointer font-bold text-xs flex items-center justify-center"
            title="Decrease Zoom Level"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1 px-1.5 bg-white hover:bg-neutral-950 hover:text-white border border-neutral-150 rounded-lg text-neutral-500 hover:text-white transition-all cursor-pointer font-bold text-xs flex items-center justify-center"
            title="Reset Map Transformation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Map Info Badge displaying Zoom values */}
        <div className="absolute top-3 left-3 backdrop-blur-md bg-white/95 px-3 py-1 rounded-lg border border-neutral-200/50 text-[10px] text-neutral-500 font-mono font-bold shadow-sm flex items-center gap-1.5 select-none">
          <Globe className="w-3.5 h-3.5 text-cyan-600 animate-spin" style={{ animationDuration: '9s' }} />
          <span>WGS-84 PLOTTER</span>
          {zoom > 1 && (
            <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-1.5 py-0.2 rounded font-black">
              {zoom.toFixed(1)}X ZOOM
            </span>
          )}
        </div>

        {/* Floating Legend Badge */}
        <div className="absolute bottom-3 left-3 backdrop-blur-md bg-white/90 px-3.5 py-2.5 rounded-xl border border-neutral-200/60 text-[10px] text-neutral-600 flex flex-col gap-1.5 select-none font-mono font-bold shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
            </span>
            <span>Hotspots ({monitoredCountries.filter(c => (countryCounts[c.name] || 0) > 0).length} regions active)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-650 inline-block"></span>
            <span>Documented coordinates</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 opacity-60 inline-block"></span>
            <span>No cases reported</span>
          </div>
        </div>

        {/* Premium Tooltip absolute overlay */}
        {hoveredIncident && (
          <div
            className="absolute z-50 pointer-events-none bg-neutral-950/95 backdrop-blur-md border border-neutral-800 text-white p-3 rounded-2xl shadow-xl text-left max-w-[280px] transition-all duration-200"
            style={{
              left: `${tooltipPos.x + 12}px`,
              top: `${tooltipPos.y - 100}px`,
            }}
          >
            <div className="flex items-center gap-1 text-[9px] font-mono font-black text-red-450 uppercase tracking-widest mb-1">
              <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
              <span>{hoveredIncident.category.toUpperCase()}</span>
            </div>
            
            <h4 className="text-xs font-extrabold uppercase leading-tight line-clamp-2">
              {hoveredIncident.title}
            </h4>

            <p className="text-[10px] text-neutral-400 line-clamp-2 mt-1 leading-normal font-medium">
              {hoveredIncident.description}
            </p>

            <div className="flex gap-2 mt-2 pt-1.5 border-t border-neutral-900 text-[9px] text-neutral-500 font-bold font-mono">
              <span className="text-neutral-350">{hoveredIncident.date}</span>
              <span>•</span>
              <span className="truncate">{hoveredIncident.city ? `${hoveredIncident.city}, ` : ''}{hoveredIncident.country}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bento Grid Styling: Country filter panels underneath the map */}
      <div className="mt-6 border-t border-neutral-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono tracking-widest font-black text-neutral-400 uppercase">
            CHOOSE MONITORING TERRITORY
          </span>
          <span className="text-[10px] font-mono text-neutral-400 font-bold flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Click region block to filter
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {monitoredCountries.map((c) => {
            const count = countryCounts[c.name] || 0;
            const isSelected = selectedCountry === c.name;
            return (
              <button
                key={`quick-bento-${c.name}`}
                onClick={() => handleCountryClick(c.name)}
                className={`flex flex-col p-3 rounded-2xl border transition-all text-left cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'bg-neutral-950 border-neutral-950 text-white shadow-lg scale-[1.02]'
                    : 'bg-neutral-50 border-neutral-200 hover:border-neutral-350 hover:bg-neutral-100/90 text-neutral-700 hover:scale-[1.01]'
                }`}
              >
                {/* Visual Highlight indicator inside card */}
                {count > 0 && !isSelected && (
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-650 animate-pulse" />
                )}

                <span className={`text-[9px] uppercase tracking-wider font-extrabold font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                  {c.name}
                </span>

                <span className="text-xl font-black mt-2 flex items-baseline gap-1 font-sans">
                  <span className={isSelected ? 'text-white' : 'text-neutral-900 group-hover:text-red-650 transition-colors'}>
                    {count}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono font-bold lowercase">
                    {count === 1 ? 'case' : 'cases'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
