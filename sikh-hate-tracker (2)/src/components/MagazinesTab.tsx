import React, { useState } from 'react';
import { Magazine } from '../types';
import { 
  FileDown, BookOpen, Upload, Calendar, Trash2, CheckCircle, 
  XCircle, Loader2, Sparkles, AlertCircle, FileText, Info, Globe, Link as LinkIcon 
} from 'lucide-react';

interface MagazinesTabProps {
  magazines: Magazine[];
  isAdmin: boolean;
  onUploadMagazine: (payload: {
    title: string;
    issueNumber: string;
    publishDate: string;
    description: string;
    fileName?: string;
    fileBase64?: string;
    fileSize?: string;
    fileUrl?: string;
    uploadMethod: 'file' | 'url';
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteMagazine: (id: string) => void;
}

export default function MagazinesTab({ 
  magazines, 
  isAdmin, 
  onUploadMagazine, 
  onDeleteMagazine 
}: MagazinesTabProps) {
  
  // Magazine uploader state
  const [title, setTitle] = useState('');
  const [issueNumber, setIssueNumber] = useState('');
  const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Method state (file vs web URL link)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [customFileSize, setCustomFileSize] = useState('');

  // File metadata & raw base64 data
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState('');

  // Status flags
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF documents are supported for upload.');
      setFileObject(null);
      setFileBase64(null);
      return;
    }

    // PDF Size validation (max 30MB for base64 limits)
    if (file.size > 30 * 1024 * 1024) {
      setUploadError('PDF file size is too large. Please select a document under 30MB.');
      setFileObject(null);
      setFileBase64(null);
      return;
    }

    setFileObject(file);
    setUploadError(null);

    // Read file as base64 string
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawBase64 = reader.result.split(',')[1]; // Strip prefix data:application/pdf;base64,
        setFileBase64(rawBase64);
        
        // Formulate size string
        const sizeKb = Math.round(file.size / 1024);
        const sizeStr = sizeKb > 1000 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
        setFileSizeStr(sizeStr);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to parse file binaries');
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload Form handler
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccess(null);
    setUploadError(null);

    if (!title.trim() || !issueNumber.trim() || !publishDate) {
      setUploadError('Please fill out all required inputs (*).');
      return;
    }

    if (uploadMethod === 'file') {
      if (!fileObject || !fileBase64) {
        setUploadError('Please select a valid PDF file for upload.');
        return;
      }
    } else {
      if (!fileUrlInput.trim()) {
        setUploadError('Please enter a Web Link / URL to the PDF document.');
        return;
      }
      if (!fileUrlInput.trim().toLowerCase().startsWith('http://') && !fileUrlInput.trim().toLowerCase().startsWith('https://')) {
        setUploadError('Document URL link must start with http:// or https://');
        return;
      }
    }

    setIsUploading(true);

    try {
      const payload = uploadMethod === 'file' ? {
        title,
        issueNumber,
        publishDate,
        description,
        fileName: fileObject!.name,
        fileBase64: fileBase64!,
        fileSize: fileSizeStr,
        uploadMethod: 'file' as const
      } : {
        title,
        issueNumber,
        publishDate,
        description,
        fileName: 'Direct PDF Document',
        fileUrl: fileUrlInput.trim(),
        fileSize: customFileSize.trim() || 'External URL',
        uploadMethod: 'url' as const
      };

      const res = await onUploadMagazine(payload);

      if (res.success) {
        setUploadSuccess(`Succesfully published Panth Prakash Issue: ${issueNumber}`);
        // Reset form
        setTitle('');
        setIssueNumber('');
        setPublishDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setFileObject(null);
        setFileBase64(null);
        setFileSizeStr('');
        setFileUrlInput('');
        setCustomFileSize('');
        // Clean file input physically
        const fileInput = document.getElementById('uploader-pdf') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setUploadError(res.error || 'Failed to complete registration. Confirm admin status is still active.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Server upload connection failure');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white text-neutral-800">
      
      {/* MAGZINES ARCHIVE LIST: (Lg: 8/12 if admin uploader is open, otherwise Full) */}
      <div className={isAdmin ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
        
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-850">
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-650">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[9px] tracking-widest text-red-650 font-mono uppercase font-extrabold block">
                OFFICIAL PUBLICATION
              </span>
              <h2 className="text-xl font-extrabold text-neutral-900 mt-1 uppercase">Panth Prakash Magazine Archive</h2>
              <p className="text-xs text-neutral-500 mt-2 max-w-4xl leading-relaxed">
                Download current and retrospective editions of our official journal, <strong className="text-neutral-700">Panth Prakash</strong>. Each publication features indepth investigative reports on human rights, historical Sikh perspective reviews, community profiles, and security analyses.
              </p>
            </div>
          </div>
        </div>

        {/* Magazines list view */}
        {magazines.length === 0 ? (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-16 text-center text-neutral-400">
            <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-4" />
            <span className="text-neutral-800 font-bold block uppercase tracking-wider text-xs">Archive Empty</span>
            <p className="text-xs text-neutral-500 mt-2 max-w-xs mx-auto">
              There are currently no magazine PDF copies uploaded to the system.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {magazines.map((mag) => (
              <div 
                key={mag.id}
                className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-2xl p-6 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-3 font-semibold">
                    <span className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-2.5 py-0.5 rounded font-bold uppercase">
                      {mag.issueNumber}
                    </span>
                    <span className="flex items-center gap-1 font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      {mag.publishDate}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-neutral-900 hover:text-red-650 transition-all leading-tight uppercase">
                    {mag.title}
                  </h3>
                  
                  <p className="text-xs text-neutral-500 mt-3 leading-relaxed font-serif line-clamp-3">
                    {mag.description || 'No summary comments registered for this edition of Panth Prakash.'}
                  </p>

                  <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                    <div className="w-10 h-12 bg-white rounded border border-neutral-205 flex-shrink-0 shadow-sm flex items-center justify-center p-1 text-center text-[7px] leading-tight text-neutral-400 font-mono">
                      PDF ISSUE
                    </div>
                    <div className="text-[10px] text-neutral-500 overflow-hidden truncate">
                      <span className="block font-mono text-neutral-700 truncate font-bold" title={mag.fileName}>
                        {mag.fileName}
                      </span>
                      <span className="block text-[9px] text-neutral-400 font-mono mt-0.5 font-semibold">
                        Size: {mag.fileSize}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-[9px] font-mono text-neutral-400 block uppercase font-bold">
                    FILE CODE: {mag.id}
                  </span>

                  <div className="flex items-center gap-1.5 font-mono">
                    {isAdmin && (
                      <button
                        onClick={() => onDeleteMagazine(mag.id)}
                        className="p-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg border border-red-200 transition-all cursor-pointer"
                        title="Delete this issue from archives"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Download PDF block */}
                    <a
                      href={mag.fileUrl}
                      download={mag.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white font-bold text-[10px] uppercase rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>GET PDF</span>
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: ADMIN PDF UPLOADER BOX (Lg: 4/12 - Only visible for authenticated Admin) */}
      {isAdmin && (
        <div className="lg:col-span-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-neutral-800 h-fit">
          <div className="flex items-center gap-2 mb-4 text-neutral-800 border-b border-neutral-200 pb-3">
            <Upload className="w-4 h-4 text-neutral-500" />
            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-older">Register & Upload Edition</h4>
          </div>

          {/* Segmented Upload Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-neutral-200/60 p-1 rounded-xl mb-4 text-[10px] uppercase font-mono font-bold select-none">
            <button
              type="button"
              onClick={() => {
                setUploadMethod('file');
                setUploadError(null);
              }}
              className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                uploadMethod === 'file' 
                  ? 'bg-white text-neutral-900 shadow-sm font-extrabold' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Upload PDF File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMethod('url');
                setUploadError(null);
              }}
              className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                uploadMethod === 'url' 
                  ? 'bg-white text-neutral-900 shadow-sm font-extrabold' 
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Direct URL Link</span>
            </button>
          </div>

          {uploadSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs mb-4 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs mb-4 flex items-start gap-2 font-medium">
              <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitUpload} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Magazine Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Panth Prakash Spring Edition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Issue / volume */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Issue / Volume Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Vol. 18 / May 2026"
                value={issueNumber}
                onChange={(e) => setIssueNumber(e.target.value)}
                required
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Publish date */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Release Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                required
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
              />
            </div>

            {/* Short review summary */}
            <div>
              <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                Short Overview Summary
              </label>
              <textarea
                placeholder="Brief summary matching articles or main editorial coverage..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none whitespace-pre-wrap leading-relaxed font-sans"
              />
            </div>

            {/* File upload panel or URL panel based on method toggle */}
            {uploadMethod === 'file' ? (
              <div>
                <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                  Select Magazine PDF File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="uploader-pdf"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required={uploadMethod === 'file'}
                  className="w-full text-[10px] text-neutral-500 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-neutral-200 file:text-neutral-800 file:hover:bg-neutral-300 file:cursor-pointer bg-white border border-neutral-250 rounded-xl p-2 focus:outline-none"
                />
                {fileObject && (
                  <div className="mt-2 text-[10px] text-neutral-500 font-mono flex items-center gap-1.5 font-semibold font-bold">
                    <span className="text-emerald-600">✓ Ready:</span>
                    <span className="truncate">{fileSizeStr}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                    Direct PDF Web Link (URL) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/magazine-issue.pdf"
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    required={uploadMethod === 'url'}
                    className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                  />
                  <p className="text-[9px] text-neutral-400 mt-1">
                    Provide a direct reference link to any hosted PDF copy (e.g., Google Drive, Dropbox, Web Host).
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-mono tracking-wider font-bold text-neutral-500 uppercase block mb-1">
                    Document File Size Label <span className="text-neutral-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5.2 MB or 980 KB"
                    value={customFileSize}
                    onChange={(e) => setCustomFileSize(e.target.value)}
                    className="w-full bg-white border border-neutral-250 px-3 py-2 rounded-xl text-neutral-900 text-xs focus:ring-1 focus:ring-neutral-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-neutral-950 hover:bg-black disabled:bg-neutral-200 text-white disabled:text-neutral-400 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Configuring and registering...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Publish and Register</span>
                </>
              )}
            </button>

          </form>

          <div className="mt-4 p-3.5 bg-white border border-neutral-205 rounded-xl text-[10px] text-neutral-500 leading-relaxed flex gap-2 font-medium">
            <Info className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
            <span>
              {uploadMethod === 'file' 
                ? "Files are stored physically on the server, making them immediately statically downloadable. File size cap is 30MB."
                : "URLs point to your externally hosted PDF documents, bypassing transmission bottlenecks and body payload limits completely."}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
