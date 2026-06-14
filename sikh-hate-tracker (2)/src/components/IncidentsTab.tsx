import React, { useState, useMemo } from 'react';
import { Incident, Severity, IncidentCategory } from '../types';
import WorldMap from './WorldMap';
import { 
  Search, SlidersHorizontal, AlertTriangle, Calendar, MapPin, 
  ExternalLink, ShieldAlert, BookOpen, AlertOctagon, HelpCircle 
} from 'lucide-react';

interface IncidentsTabProps {
  incidents: Incident[];
  isAdmin: boolean;
  onDeleteAdmin?: (id: string) => void;
}

export default function IncidentsTab({ incidents, isAdmin, onDeleteAdmin }: IncidentsTabProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Category descriptions & aesthetic styles
  const categoryMeta: Record<IncidentCategory, { label: string; color: string; bg: string }> = {
    verbal: { label: 'Verbal Abuse', color: 'text-amber-700 border-amber-200', bg: 'bg-amber-50' },
    physical: { label: 'Physical Assault', color: 'text-red-700 border-red-200', bg: 'bg-red-50' },
    vandalism: { label: 'Vandalism', color: 'text-purple-700 border-purple-200', bg: 'bg-purple-50' },
    harassment: { label: 'Harassment', color: 'text-orange-700 border-orange-200', bg: 'bg-orange-50' },
    cyberbullying: { label: 'Cyberbullying', color: 'text-sky-700 border-sky-200', bg: 'bg-sky-50' },
    institutional: { label: 'Bias / Institutional', color: 'text-neutral-700 border-neutral-300', bg: 'bg-neutral-100' },
    other: { label: 'Other Incident', color: 'text-neutral-600 border-neutral-200', bg: 'bg-neutral-50' },
  };

  const severityColors: Record<Severity, string> = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-neutral-50 text-neutral-600 border-neutral-200',
  };

  const handleCountrySelection = (country: string | null) => {
    setSelectedCountry(country);
  };

  // Perform rigorous filtering of active list
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesCountry = !selectedCountry || inc.country.toLowerCase() === selectedCountry.toLowerCase();
      
      const matchesSearch = 
        !searchQuery || 
        inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        inc.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (inc.city && inc.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeverity = selectedSeverity === 'all' || inc.severity === selectedSeverity;
      const matchesCategory = selectedCategory === 'all' || inc.category === selectedCategory;

      return matchesCountry && matchesSearch && matchesSeverity && matchesCategory;
    });
  }, [incidents, selectedCountry, searchQuery, selectedSeverity, selectedCategory]);

  return (
    <div className="space-y-8 bg-white">
      
      {/* Informative Lead Header (Bento Block style) */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-650 mt-1">
              <ShieldAlert className="w-5 h-5 text-red-650" />
            </div>
            <div>
              <span className="text-[9px] tracking-widest text-red-650 font-mono uppercase font-extrabold block">
                SIKH COMMUNITY SECURITY INITIATIVE
              </span>
              <h2 className="text-xl font-extrabold text-neutral-950 tracking-tight mt-1 uppercase">
                Worldwide Hate Incidents Repository
              </h2>
              <p className="text-xs text-neutral-500 mt-2 max-w-3xl leading-relaxed">
                This monitoring database catalogs hate speech, hate crimes, institutional discrimination, 
                and physical harassment documented against the worldwide Sikh diaspora. Filter cases via physical 
                landmass, severity grading, or category using our interactive tracking tools below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-4 bg-white rounded-xl border border-neutral-200 flex flex-col items-center min-w-[120px] font-mono shadow-sm">
              <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold">Approved</span>
              <span className="text-2xl font-black text-emerald-600 mt-1">
                {incidents.filter(i => i.status === 'approved').length}
              </span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-neutral-200 flex flex-col items-center min-w-[120px] font-mono shadow-sm">
              <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold">Unreviewed</span>
              <span className="text-2xl font-black text-amber-600 mt-1">
                {incidents.filter(i => i.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* World Map Component */}
      <WorldMap 
        incidents={incidents.filter(inc => inc.status === 'approved')} 
        onSelectCountry={handleCountrySelection}
        selectedCountry={selectedCountry}
      />

      {/* Search & Custom Utilities Panel (Bento Block styling) */}
      <div className="bg-neutral-50 border border-neutral-200 p-5 rounded-2xl text-neutral-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Keyword Lookup */}
        <div className="relative">
          <label className="text-[10px] uppercase font-mono font-bold text-neutral-400 block mb-1.5">Search Keywords</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="e.g. Gurdwara, Surrey..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-200 px-9 py-2 rounded-xl text-neutral-800 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300"
            />
          </div>
        </div>

        {/* Severity scale filter */}
        <div>
          <label className="text-[10px] uppercase font-mono font-bold text-neutral-400 block mb-1.5">Incident Severity</label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-700 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300"
          >
            <option value="all">All Severity Settings</option>
            <option value="high">Critical / High (Violence/Assault)</option>
            <option value="medium">Medium Support (Vandalisms/Harassment)</option>
            <option value="low">Low Priority (Verbal remarks/Internet)</option>
          </select>
        </div>

        {/* Category breakdown filter */}
        <div>
          <label className="text-[10px] uppercase font-mono font-bold text-neutral-400 block mb-1.5">Category Classification</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-700 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300"
          >
            <option value="all">All Case Categories</option>
            <option value="verbal">Verbal Abuse & Slurs</option>
            <option value="physical">Physical Attack & Violence</option>
            <option value="vandalism">Gurdwara Target / Vandalism</option>
            <option value="harassment">General Harassment & Profiling</option>
            <option value="cyberbullying">Cyberbullying & Sticking Campaigns</option>
            <option value="institutional">Systemic Biases / Airport Screenings</option>
            <option value="other">Miscellaneous Incidents</option>
          </select>
        </div>

        {/* Active Filter status review */}
        <div className="flex flex-col justify-end h-full">
          <div className="flex flex-wrap gap-2 justify-end">
            {(selectedCountry || searchQuery || selectedSeverity !== 'all' || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSelectedCountry(null);
                  setSearchQuery('');
                  setSelectedSeverity('all');
                  setSelectedCategory('all');
                }}
                className="text-[9px] uppercase tracking-wider px-3 py-1.5 bg-red-50 hover:bg-red-650 hover:text-white text-red-600 border border-red-200 rounded-lg font-bold font-mono transition-all cursor-pointer"
              >
                Reset Filters ×
              </button>
            )}
            <span className="text-[10px] text-neutral-500 self-center font-mono py-1.5 px-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
              Filtered Result: <strong>{filteredIncidents.length}</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Incidents List Grid */}
      <div className="space-y-4 bg-white">
        {filteredIncidents.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-16 text-center text-neutral-400">
            <AlertTriangle className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <span className="text-neutral-800 font-bold block uppercase tracking-wider text-xs">No Active Records Found</span>
            <p className="text-xs text-neutral-400 mt-2 max-w-xs mx-auto">
              Please adjust your filter options, country markers, or keyword lookup queries to discover archived cases.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIncidents.map((incident) => {
              const categoryDetails = categoryMeta[incident.category] || categoryMeta.other;
              return (
                <div
                  key={incident.id}
                  className={`bg-white border rounded-2xl p-6 shadow-sm transition-all flex flex-col justify-between ${
                    incident.status === 'pending' ? 'border-red-300 bg-red-55/30' : 'border-neutral-200 hover:border-neutral-350'
                  }`}
                >
                  <div>
                    {/* Upper Badging Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={`text-[9.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${categoryDetails.color} ${categoryDetails.bg}`}>
                          {categoryDetails.label}
                        </span>
                        <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-md border uppercase ${severityColors[incident.severity]}`}>
                          {incident.severity}
                        </span>
                        {incident.status === 'pending' && (
                          <span className="text-[9.5px] px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 font-extrabold uppercase tracking-wider">
                            Pending Review
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(incident.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {/* Headline */}
                    <h3 className="text-base font-extrabold text-neutral-900 tracking-tight hover:text-red-650 transition-all leading-tight uppercase">
                      {incident.title}
                    </h3>

                    {/* Incident Location */}
                    <div className="text-xs text-neutral-500 flex items-center gap-1 mt-2.5 font-mono uppercase tracking-tight font-bold">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>
                        {incident.city ? `${incident.city}, ` : ''}{incident.country}
                      </span>
                    </div>

                    {/* Description Paragraph */}
                    <p className="text-xs text-neutral-500 leading-relaxed mt-4 whitespace-pre-wrap font-serif">
                      {incident.description}
                    </p>
                  </div>

                  {/* Footing actions */}
                  <div className="flex items-center justify-between gap-3 pt-4 mt-6 border-t border-neutral-100">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold">
                      RECORD ID: {incident.id}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Delete option for admin */}
                      {isAdmin && onDeleteAdmin && (
                        <button
                          onClick={() => onDeleteAdmin(incident.id)}
                          className="px-2.5 py-1 text-[9px] font-mono font-bold rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-250 transition-all cursor-pointer uppercase tracking-wider"
                        >
                          Delete
                        </button>
                      )}

                      {/* Source Link */}
                      {incident.sourceUrl ? (
                        <a
                          href={incident.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg flex items-center gap-1 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                          <span>View Source</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono italic">No reference source</span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
