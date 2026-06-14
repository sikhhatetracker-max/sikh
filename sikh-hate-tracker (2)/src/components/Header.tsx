import React from 'react';
import { AlertOctagon, Coffee, Twitter, FileText, Activity, LogIn, Lock } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  onLogout: () => void;
  openAdminModal: () => void;
}

export default function Header({ activeTab, setActiveTab, isAdmin, onLogout, openAdminModal }: HeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-4 sm:h-20 gap-4">
          
          {/* Logo / Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-neutral-900 rounded-lg flex items-center justify-center font-bold text-white text-base">
              S
            </div>
            <div>
              <h1 className="text-base font-extrabold text-neutral-900 tracking-tight leading-none uppercase">
                Sikh Hate Tracker
              </h1>
              <span className="text-[9px] tracking-widest text-neutral-500 font-mono uppercase font-semibold mt-1 block">
                Human Rights Audit Platform
              </span>
            </div>
          </div>

          {/* Social connections & Donation links */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Official X.com Page Link */}
            <a
              href="https://x.com/sikhhatetracker"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:px-3 sm:py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg text-xs font-medium flex items-center gap-2 transition-all"
            >
              <Twitter className="w-3.5 h-3.5 fill-current text-neutral-500" />
              <span className="hidden sm:inline">@sikhhatetracker</span>
            </a>

            {/* Buy Me A Coffee (User Request) */}
            <a
              href="https://buymeacoffee.com/sikhhatetracker"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-[#FFDD00] text-neutral-900 hover:bg-[#ffea00] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors font-sans"
            >
              <span>☕ Support</span>
            </a>

            {/* Admin status tag */}
            {isAdmin ? (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1 font-mono"
                title="Click to logout admin session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <button
                onClick={openAdminModal}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-250 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-950 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 font-mono"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>

        </div>

        {/* Tab Navigation Menu (Bento style sub-capsule) */}
        <div className="flex border-t border-neutral-100 py-3 overflow-x-auto scrollbar-none justify-center">
          <nav className="flex gap-1 bg-neutral-50 p-1 rounded-xl border border-neutral-154 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'incidents'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-red-500" />
              <span>Incidents Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab('reporting')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'reporting'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <PlusCircleIcon className="w-3.5 h-3.5 text-neutral-450" />
              <span>Submit Report</span>
            </button>

            <button
              onClick={() => setActiveTab('magazines')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'magazines'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Panth Prakash</span>
            </button>

            <button
              onClick={() => setActiveTab('bulletins')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'bulletins'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Bulletins & Briefings</span>
            </button>
          </nav>
        </div>

      </div>
    </header>
  );
}

// Inline fallback icon to prevent import compilation crash if any helper is missing
function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/>
    </svg>
  );
}
