import React, { useState } from 'react';
import { Bulletin } from '../types';
import { 
  Megaphone, PlusCircle, Trash2, Calendar, CheckCircle, 
  XCircle, Loader2, Info, FileText, Newspaper 
} from 'lucide-react';

interface BulletinsTabProps {
  bulletins: Bulletin[];
  isAdmin: boolean;
  onPostBulletin: (payload: { title: string; content: string; date: string }) => Promise<boolean>;
  onDeleteBulletin: (id: string) => void;
}

export default function BulletinsTab({ 
  bulletins, 
  isAdmin, 
  onPostBulletin, 
  onDeleteBulletin 
}: BulletinsTabProps) {
  
  // Bulletin poster form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Operational status
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  // Post form submission handler
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostSuccess(null);
    setPostError(null);

    if (!title.trim() || !content.trim() || !date) {
      setPostError('Please fill out all required fields.');
      return;
    }

    setIsPosting(true);
    try {
      const ok = await onPostBulletin({ title, content, date });
      if (ok) {
        setPostSuccess('Bulletin published and circulated successfully!');
        setTitle('');
        setContent('');
        setDate(new Date().toISOString().split('T')[0]);
      } else {
        setPostError('Failed to publish. Re-verify your administrator status.');
      }
    } catch (err: any) {
      setPostError('Network alert: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white">
      
      {/* BULLETINS TIMELINE: (Lg: 8/12 if admin poster is active, otherwise Full) */}
      <div className={isAdmin ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
        
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-800">
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-xl text-red-650 border border-red-105">
              <Megaphone className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <span className="text-[9px] tracking-widest text-red-600 font-mono uppercase font-extrabold block">
                INTELLIGENCE BRIEFINGS
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 mt-1 uppercase tracking-tight">Community Bulletins & Alerts</h2>
              <p className="text-xs text-neutral-500 mt-2 max-w-4xl leading-relaxed">
                Stay updated with immediate safety warnings, active legal campaign developments, 
                and advocacy alerts published directly by our human rights audit squad.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline representation of Bulletins */}
        {bulletins.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-16 text-center text-neutral-500">
            <Newspaper className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <span className="text-neutral-800 font-bold block uppercase tracking-wider text-xs">No Bulletins Logged</span>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              There are currently no official security alerts, monitoring circulars, or press bulletins filed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {bulletins.map((bulletin) => (
              <div 
                key={bulletin.id}
                className="bg-white border border-neutral-200 hover:border-neutral-350 rounded-2xl p-6 transition-all text-neutral-800 flex flex-col justify-between"
              >
                <div>
                  {/* Metadata line */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-4">
                    <span className="flex items-center gap-1 bg-red-55/60 text-red-600 border border-red-100 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      ★ Active Circular
                    </span>
                    <span className="flex items-center gap-1 text-neutral-500 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(bulletin.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Bulletin Header */}
                  <h3 className="text-base font-extrabold text-neutral-900 hover:text-red-600 transition-all tracking-tight leading-tight uppercase">
                    {bulletin.title}
                  </h3>

                  {/* Body Paragraph */}
                  <p className="text-xs text-neutral-600 leading-relaxed mt-4 whitespace-pre-wrap font-serif">
                    {bulletin.content}
                  </p>
                </div>

                {/* Footer bar */}
                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-[9px] text-neutral-400 uppercase font-mono">
                  <span>
                    ALERT ID: {bulletin.id}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => onDeleteBulletin(bulletin.id)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-lg font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1 uppercase"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Retract Bulletin</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: ADMIN COMPOSER BOX (Lg: 4/12 - Only visible for authenticated Admin) */}
      {isAdmin && (
        <div className="lg:col-span-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-800 h-fit">
          <div className="flex items-center gap-2 mb-4 text-red-600 border-b border-neutral-200 pb-3">
            <PlusCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">Post New Bulletin</h4>
          </div>

          {postSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{postSuccess}</span>
            </div>
          )}

          {postError && (
            <div className="bg-red-50 border border-red-150 text-red-700 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{postError}</span>
            </div>
          )}

          <form onSubmit={handlePostSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-505 uppercase block mb-1">
                Headline <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Incident Monitoring Update Surrey"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-505 uppercase block mb-1">
                Publish Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-red-500"
              />
            </div>

            {/* Content body */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-505 uppercase block mb-1">
                Detailed Briefing Content <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Write out the formal safety warning or news campaign detail thoroughly..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="w-full bg-white border border-neutral-200 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-red-500 whitespace-pre-wrap leading-relaxed font-sans"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPosting}
              className="w-full py-2.5 bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Circulating alert...</span>
                </>
              ) : (
                <>
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Publish Circular</span>
                </>
              )}
            </button>

          </form>

          <div className="mt-4 p-3.5 bg-white border border-neutral-150 rounded-xl text-[10px] text-neutral-450 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
            <span>Circulars are published to the main client bulletin boards immediately on submission. Direct updates are stored inside persistent container arrays.</span>
          </div>
        </div>
      )}

    </div>
  );
}
