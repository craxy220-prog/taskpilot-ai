import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocuments } from '../../hooks/useDocuments';
import { Upload, FileText, X, Check, Loader2 } from 'lucide-react';
import { cn, formatFileSize } from '../../lib/utils';

export default function DocumentUpload() {
  const { uploadDocument } = useDocuments();
  const [files, setFiles] = useState<Array<{ file: File; progress: string; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }>>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    onDrop: async (acceptedFiles) => {
      const newFiles = acceptedFiles.map(f => ({
        file: f,
        progress: 'Starting...',
        status: 'pending' as const,
      }));
      setFiles(prev => [...prev, ...newFiles]);

      for (const f of newFiles) {
        setFiles(prev => prev.map(p =>
          p.file === f.file ? { ...p, status: 'uploading', progress: 'Uploading...' } : p
        ));

        const result = await uploadDocument(f.file);

        setFiles(prev => prev.map(p =>
          p.file === f.file
            ? result?.status === 'ready'
              ? { ...p, status: 'done', progress: 'Done!' }
              : { ...p, status: 'error', progress: 'Failed', error: result?.error || 'Upload failed' }
            : p
        ));
      }
    },
  });

  // Clean up done files after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiles(prev => prev.filter(f => f.status !== 'done'));
    }, 5000);
    return () => clearTimeout(timer);
  }, [files]);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer",
          isDragActive
            ? "border-accent bg-accent/5"
            : "border-border/50 hover:border-accent/50 hover:bg-muted/30",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
            isDragActive ? "bg-accent/20" : "bg-muted/50",
          )}>
            <Upload className={cn(
              "w-6 h-6 transition-colors duration-200",
              isDragActive ? "text-accent" : "text-foreground/40",
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop your document here' : 'Upload a document'}
            </p>
            <p className="text-xs text-foreground/40 mt-1">
              PDF, DOCX, TXT, or MD — up to 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 rounded-xl border border-border/30">
              <FileText className="w-4 h-4 text-foreground/40 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{f.file.name}</p>
                <p className="text-[10px] text-foreground/40">{formatFileSize(f.file.size)}</p>
              </div>
              {f.status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
              )}
              {f.status === 'done' && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
              )}
              {f.status === 'error' && (
                <div className="relative group shrink-0">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-400" />
                  </div>
                  {f.error && (
                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg px-2 py-1 text-xs text-foreground/70 whitespace-nowrap shadow-lg z-10">
                      {f.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}