import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import IncidentsTab from './components/IncidentsTab';
import ReportTab from './components/ReportTab';
import MagazinesTab from './components/MagazinesTab';
import BulletinsTab from './components/BulletinsTab';
import { Incident, Bulletin, Magazine } from './types';
import { 
  Lock, Key, X, AlertTriangle, CheckCircle2, ShieldCheck, 
  BookOpen, Eye, Info, RefreshCw, LogIn 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Application Data States
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  
  // Loading & Network status
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load Admin Token from Session Storage on startup
  useEffect(() => {
    const savedToken = sessionStorage.getItem('sikh_hate_tracker_token');
    if (savedToken === 'Jora@1709') {
      setIsAdmin(true);
    }
  }, []);

  // Fetch all core directories
  const fetchData = async (isAdminSession = isAdmin) => {
    setSyncing(true);
    try {
      // Determine headers
      const headers: Record<string, string> = {};
      if (isAdminSession) {
        headers['sikh-hate-tracker-role'] = 'admin';
        headers['Authorization'] = 'Bearer Jora@1709';
      }

      // 1. Incidents
      const incidentsRes = await fetch('/api/incidents', { headers });
      if (!incidentsRes.ok) throw new Error('Failed to retrieve primary incidents catalog');
      const incidentsData = await incidentsRes.json();
      setIncidents(incidentsData);

      // 2. Bulletins
      const bulletinsRes = await fetch('/api/bulletins');
      if (!bulletinsRes.ok) throw new Error('Failed to retrieve circular bulletin postings');
      const bulletinsData = await bulletinsRes.json();
      setBulletins(bulletinsData);

      // 3. Magazines
      const magazinesRes = await fetch('/api/magazines');
      if (!magazinesRes.ok) throw new Error('Failed to retrieve Panth Prakash archive catalog');
      const magazinesData = await magazinesRes.json();
      setMagazines(magazinesData);

      setFetchError(null);
    } catch (err: any) {
      console.error('Data synchronization crash:', err);
      setFetchError(err.message || 'Server connection error');
    } finally {
      setIsLoading(false);
      setSyncing(false);
    }
  };

  // Sync data on startup and when admin status changes
  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  // Administration login checker
  const handleAdminLogin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem('sikh_hate_tracker_token', 'Jora@1709');
        setIsAdmin(true);
        setAdminModalOpen(false);
        setModalError(null);
        return true;
      }
    } catch (e) {
      console.error('Admin authentication crash:', e);
    }
    return false;
  };

  // Admin Logout check
  const handleAdminLogout = () => {
    sessionStorage.removeItem('sikh_hate_tracker_token');
    setIsAdmin(false);
  };

  // Header Modal authorization trigger
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasswordInput) return;

    const ok = await handleAdminLogin(adminPasswordInput);
    if (ok) {
      setAdminPasswordInput('');
    } else {
      setModalError('Incorrect passcode credentials. Please try again.');
    }
  };

  // Admin action triggers: Approve incident
  const handleApproveIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/incidents/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer Jora@1709' },
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Fail to approve incident directory.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin action: Reject / Dismiss pending report
  const handleRejectIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/incidents/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer Jora@1709' },
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Fail to dismiss incident directory.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin action: Delete incident completely
  const handleDeleteIncident = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this incident record permanently from the database?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer Jora@1709' },
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Fail to delete incident.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin action: Post Bulletin circular
  const handlePostBulletin = async (payload: { title: string; content: string; date: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/bulletins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer Jora@1709' 
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        fetchData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Admin action: Retract/Delete Bulletin circular
  const handleDeleteBulletin = async (id: string) => {
    if (!confirm('Retract this official circular from public boards?')) return;
    try {
      const res = await fetch(`/api/admin/bulletins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer Jora@1709' },
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to retract bulletin.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin action: Upload/Register Panth Prakash catalog item
  const handleUploadMagazine = async (payload: {
    title: string;
    issueNumber: string;
    publishDate: string;
    description: string;
    fileName?: string;
    fileBase64?: string;
    fileSize?: string;
    fileUrl?: string;
    uploadMethod: 'file' | 'url';
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/magazines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer Jora@1709'
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();
      if (res.ok) {
        fetchData();
        return { success: true };
      } else {
        return { success: false, error: responseData.error || 'Server rejected registration' };
      }
    } catch (e: any) {
      console.error(e);
      return { success: false, error: e.message || 'Server upload connection failure' };
    }
  };

  // Admin action: Delete Magazine catalog
  const handleDeleteMagazine = async (id: string) => {
    if (!confirm('Are you sure you want to remove this magazine issue and delete its PDF static file from the server permanently?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/magazines/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer Jora@1709' },
      });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to delete magazine: ${errData.error || res.statusText || 'Unknown error'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Network connection error during deletion: ${e.message}`);
    }
  };

  // Extract pending backlog
  const pendingIncidents = incidents.filter(inc => inc.status === 'pending');
  // Approved list
  const approvedIncidents = incidents.filter(inc => inc.status === 'approved');

  return (
    <div className="min-h-screen bg-white text-neutral-800 font-sans flex flex-col justify-between">
      
      {/* Top Banner Header */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onLogout={handleAdminLogout}
        openAdminModal={() => {
          setModalError(null);
          setAdminModalOpen(true);
        }}
      />

      {/* Main Container Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full bg-white">
        
        {/* Syncing/Loading Indicator overlays */}
        {syncing && (
          <div className="bg-amber-50 border border-amber-250 text-amber-800 px-4 py-2 rounded-xl text-xs mb-6 flex items-center justify-between gap-4 font-mono select-none">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Database Synchronizing...
            </span>
            <button 
              onClick={() => fetchData()}
              disabled={syncing}
              className="text-[10px] bg-white border border-amber-200 px-2.5 py-0.5 rounded-lg hover:bg-amber-100 font-bold transition-all text-amber-900 cursor-pointer"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Global Loading screen */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-neutral-500">
            <div className="relative w-10 h-10 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200 border-t-neutral-900 animate-spin" />
            </div>
            <span className="text-sm font-bold tracking-wide text-neutral-800">Synchronizing platform data...</span>
            <span className="text-[10px] text-neutral-400 font-mono mt-1">Connecting to human rights record index</span>
          </div>
        ) : (
          /* Route Page Switcher based on selection */
          <div className="transition-opacity duration-300">
            {activeTab === 'incidents' && (
              <IncidentsTab 
                incidents={incidents} 
                isAdmin={isAdmin}
                onDeleteAdmin={handleDeleteIncident}
              />
            )}

            {activeTab === 'reporting' && (
              <ReportTab 
                isAdmin={isAdmin}
                onLogin={handleAdminLogin}
                pendingIncidents={pendingIncidents}
                onApprove={handleApproveIncident}
                onReject={handleRejectIncident}
                onRefreshPending={() => fetchData(true)}
              />
            )}

            {activeTab === 'magazines' && (
              <MagazinesTab 
                magazines={magazines}
                isAdmin={isAdmin}
                onUploadMagazine={handleUploadMagazine}
                onDeleteMagazine={handleDeleteMagazine}
              />
            )}

            {activeTab === 'bulletins' && (
              <BulletinsTab 
                bulletins={bulletins}
                isAdmin={isAdmin}
                onPostBulletin={handlePostBulletin}
                onDeleteBulletin={handleDeleteBulletin}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="bg-neutral-50 border-t border-neutral-150 py-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-neutral-800 uppercase tracking-tight">Sikh Hate Tracker Project</span>
            <span className="block text-[10px] text-neutral-400 mt-0.5">© 2026. Civic human rights documentation registry. Non-partisan, non-governmental.</span>
            <span className="block text-[10px] text-neutral-500 mt-1">
              Contact: <a href="mailto:Sikhhatetracker@protonmail.com" className="hover:text-red-700 underline font-medium font-mono">Sikhhatetracker@protonmail.com</a>
            </span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <a 
              href="https://x.com/sikhhatetracker" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-neutral-900 transition-all font-medium"
            >
              Official X Page
            </a>
            <span>•</span>
            <a 
              href="https://buymeacoffee.com/sikhhatetracker" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-amber-500 transition-all font-bold text-amber-600"
            >
              Donate Project
            </a>
          </div>
        </div>
      </footer>

      {/* Floating Header Admin Passcode Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-sm w-full p-6 relative shadow-xl text-neutral-700">
            <button
              onClick={() => setAdminModalOpen(false)}
              className="absolute right-4 top-4 hover:bg-neutral-105 p-1 rounded-md text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="bg-red-50 p-2.5 rounded-xl text-red-600 border border-red-100">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-neutral-900 uppercase tracking-tight leading-none">Admin Portal</h4>
                <p className="text-[10px] text-neutral-400 mt-1">Verification credentials required</p>
              </div>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-150 text-red-700 p-3 rounded-xl text-[11px] mb-4 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                  Auditor Passcode
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    placeholder="Enter security key"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    required
                    className="w-full bg-neutral-50 border border-neutral-200 px-9 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
