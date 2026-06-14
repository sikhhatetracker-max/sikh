import React, { useState } from 'react';
import { Incident, Severity, IncidentCategory } from '../types';
import { 
  Send, Lock, ShieldCheck, Mail, Globe, Sparkles, MapPin, 
  CheckCircle, XCircle, AlertCircle, Info, Key, Loader2, ListCollapse 
} from 'lucide-react';

interface ReportTabProps {
  isAdmin: boolean;
  onLogin: (password: string) => Promise<boolean>;
  pendingIncidents: Incident[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRefreshPending: () => void;
}

// Default coordinates for automatic Mapping, matching common countries
const countryCoords: Record<string, { lat: number; lon: number }> = {
  'Canada': { lat: 56.13, lon: -106.34 },
  'United States': { lat: 37.09, lon: -95.71 },
  'United Kingdom': { lat: 55.37, lon: -3.43 },
  'India': { lat: 20.59, lon: 78.96 },
  'Australia': { lat: -25.27, lon: 133.77 },
  'Italy': { lat: 41.87, lon: 12.56 },
  'Germany': { lat: 51.16, lon: 10.45 },
  'Pakistan': { lat: 30.37, lon: 69.34 },
  'Afghanistan': { lat: 33.93, lon: 67.70 },
  'New Zealand': { lat: -40.90, lon: 174.88 },
  'Other': { lat: 20.0, lon: 0.0 }
};

export default function ReportTab({ 
  isAdmin, 
  onLogin, 
  pendingIncidents, 
  onApprove, 
  onReject,
  onRefreshPending
}: ReportTabProps) {
  
  // Public reporting state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [country, setCountry] = useState('Canada');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('verbal');
  const [severity, setSeverity] = useState<Severity>('low');
  const [sourceUrl, setSourceUrl] = useState('');
  
  // Submission flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Admin login section toggle
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Public Report submission handler
  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date || !country) {
      setSubmitError('Please fill out all mandatory fields highlighted (*)');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);

    // Auto-resolve Lat/Lon using preset map matrix to keep reporting user-friendly
    const coordLookup = countryCoords[country] || countryCoords.Other;

    const payload = {
      title,
      description,
      date,
      country,
      city,
      latitude: coordLookup.lat,
      longitude: coordLookup.lon,
      severity,
      category,
      sourceUrl,
    };

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit the incident report');
      }

      setSubmitMessage('Your report was uploaded successfully! It is queued for admin audit.');
      // Flush form
      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCity('');
      setSourceUrl('');
      // Refresh backend list
      onRefreshPending();
    } catch (err: any) {
      setSubmitError(err.message || 'Network communication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Login handler
  const handleAdminPanelLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) return;

    setAdminLoading(true);
    setAdminError(null);
    try {
      const ok = await onLogin(adminPasswordInput);
      if (ok) {
        setAdminPasswordInput('');
      } else {
        setAdminError('Incorrect passcode credentials. Please retry.');
      }
    } catch (err: any) {
      setAdminError('System login crash: ' + err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white text-neutral-800">
      
      {/* LEFT COLUMN: PUBLIC REPORTING FORM (Lg: 7/12) */}
      <div className="lg:col-span-7 bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-850">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-50 p-3 rounded-xl border border-red-105">
            <Send className="w-5 h-5 text-red-650" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-tight">Submit an Incident Report</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Securely register experienced or witnessed Sikhophobia for verification and tracking, or contact us directly at <a href="mailto:Sikhhatetracker@protonmail.com" className="font-bold text-red-700 hover:underline">Sikhhatetracker@protonmail.com</a>.
            </p>
          </div>
        </div>

        {submitMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <div>
              <strong className="block font-bold">Incident Registered</strong>
              <p className="mt-0.5">{submitMessage}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="bg-red-50 border border-red-150 text-red-700 p-4 rounded-xl text-xs mb-6 flex items-start gap-2 font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <div>
              <strong className="block font-bold">Submission Failure</strong>
              <p className="mt-0.5">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePublicSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Incident Summary / Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Verbal abuse outside Vancouver Gurdwara"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Occurrence Date */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Date of Occurrence <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Country Selector */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-700 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              >
                {Object.keys(countryCoords).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                City, State / Province
              </label>
              <input
                type="text"
                placeholder="e.g. Surrey, BC"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Incident Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-700 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              >
                <option value="verbal">Verbal Abuse / Slurs</option>
                <option value="physical">Physical Assault / Violence</option>
                <option value="vandalism">Property Vandalism / Graffiti</option>
                <option value="harassment">Targeted Profiling / Harassment</option>
                <option value="cyberbullying">Cyberbullying / Online Threat</option>
                <option value="institutional">Systemic Bias (Security Bias)</option>
                <option value="other">Other / General Incident</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Severity Rating <span className="text-red-500">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-700 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              >
                <option value="low">Low (Explicit comments, cyber text only)</option>
                <option value="medium">Medium (Threats, physical tracking, defacement)</option>
                <option value="high">Critical / High (Immediate bodily harm / physical assault)</option>
              </select>
            </div>

            {/* Source URL support link */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Supporting Link (e.g. News, Tweet)
              </label>
              <input
                type="url"
                placeholder="https://x.com/username/status/..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Detailed Description */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Description of the Incident <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Provide a thorough overview of the incident. Include words spoken if possible, perpetrator details, and whether local law authorities were briefed."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none whitespace-pre-wrap leading-relaxed font-sans"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-200 text-white disabled:text-neutral-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                <span>Transmitting report...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Incident for Review</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-white rounded-xl border border-neutral-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-neutral-500 leading-relaxed font-medium">
            <strong>Auditing Policy:</strong> Every submitted report enters an evaluation pool. All details (excluding personal info) are inspected by authorized human rights auditors for legitimacy before being plotted on the core incident heatmap.
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: ADMIN MODERATION / QUEUE BOX (Lg: 5/12) */}
      <div className="lg:col-span-5 flex flex-col gap-6 bg-white">
        
        {/* Verification Status Card */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-800">
          {!isAdmin ? (
            // Authentication Block
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2.5 rounded-xl text-neutral-500 border border-neutral-200 shadow-sm">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider leading-none">Auditor Credentials</h4>
                  <span className="text-[9px] text-neutral-400 font-mono block mt-1">Unlock pending approvals</span>
                </div>
              </div>

              {adminError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs mb-3 flex items-center gap-2 font-medium">
                  <XCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminPanelLogin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">
                    Auditor Admin Passcode
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      placeholder="••••••••••••••"
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      className="w-full bg-white border border-neutral-200 px-9 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-2 bg-neutral-950 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm disabled:bg-neutral-200"
                >
                  {adminLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Unlock Auditor View</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            // Authenticated Administrator Controls
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider">Auditor Access: Active</h4>
                </div>
                <span className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Root Session
                </span>
              </div>

              <p className="text-xs text-neutral-500 mb-5 leading-relaxed font-medium">
                You have administrative clearance. Pending review submissions from visitors are plotted here. Approve them to publish on the world map list, or reject them to dismiss.
              </p>

              {/* BACKLOG LIST */}
              <div className="space-y-3 max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-250">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 uppercase border-b border-neutral-200 pb-2 mb-2 font-bold select-none">
                  <span>Submissions Pending Approval</span>
                  <span className="text-red-650">({pendingIncidents.length})</span>
                </div>

                {pendingIncidents.length === 0 ? (
                  <div className="text-center py-12 text-neutral-450 text-xs italic font-mono border border-dashed border-neutral-200 rounded-xl">
                    Backlog clear. No pending incidents to audit.
                  </div>
                ) : (
                  pendingIncidents.map((inc) => (
                    <div 
                      key={inc.id}
                      className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 flex flex-col justify-between gap-3 text-xs shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[9px] text-neutral-400 font-bold font-mono mb-1 uppercase tracking-tight">
                          <span>{inc.city ? `${inc.city}, ` : ''}{inc.country}</span>
                          <span>{inc.date}</span>
                        </div>
                        <h5 className="font-extrabold text-neutral-900 tracking-tight uppercase">{inc.title}</h5>
                        <p className="text-[11px] text-neutral-500 mt-2 whitespace-pre-wrap leading-relaxed font-serif line-clamp-3">
                          {inc.description}
                        </p>
                        
                        <div className="flex gap-1.5 mt-3">
                          <span className="text-[8px] font-bold font-mono bg-neutral-50 border border-neutral-200 text-neutral-500 px-2 py-0.5 rounded uppercase leading-none">
                            Cat: {inc.category}
                          </span>
                          <span className="text-[8px] font-bold font-mono bg-neutral-50 border border-neutral-200 text-neutral-500 px-2 py-0.5 rounded uppercase leading-none">
                            Sev: {inc.severity}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-neutral-100">
                        <button
                          onClick={() => onReject(inc.id)}
                          className="py-1.5 cursor-pointer bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 text-[9px] font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1 select-none font-mono"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>
                        <button
                          onClick={() => onApprove(inc.id)}
                          className="py-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 text-[9px] font-bold rounded-lg uppercase transition-all flex items-center justify-center gap-1 select-none font-mono"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve Case</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Policy Panel (Bento Block style) */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-600 text-xs leading-relaxed space-y-3 shadow-sm">
          <h4 className="text-neutral-900 font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-tight">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Tracker Methodology
          </h4>
          <p className="text-[11px] text-neutral-500 leading-relaxed font-medium mt-1">
            The Sikh Hate Tracker processes reports under strict standards matching international human rights recording conventions. Categorization is structured as:
          </p>
          <ul className="space-y-1.5 text-[11px] pl-1 font-medium text-neutral-500">
            <li className="flex items-start gap-1"><strong className="text-neutral-800 min-w-[70px]">✓ Physical:</strong> Direct attacks, physical assaults, or spitting.</li>
            <li className="flex items-start gap-1"><strong className="text-neutral-800 min-w-[70px]">✓ Vandalism:</strong> Defacement of Gurdwaras or homes.</li>
            <li className="flex items-start gap-1"><strong className="text-neutral-800 min-w-[70px]">✓ Cyber:</strong> Systematic threats on the internet.</li>
          </ul>
        </div>

      </div>

    </div>
  );
}
