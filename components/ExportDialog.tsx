
import React, { useState, useEffect, useRef } from 'react';
import { ThemeColor } from '../types';
import { THEME_CONFIG } from '../App';

interface ExportDialogProps {
  currentTheme: ThemeColor;
  onConfirm: (filename: string, exportNotes: boolean, exportCategories: boolean) => void;
  onCancel: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ 
  currentTheme, 
  onConfirm, 
  onCancel 
}) => {
  const defaultFilename = `smart_notes_export_${new Date().toISOString().split('T')[0]}`;
  const [filename, setFilename] = useState(defaultFilename);
  const [exportNotes, setExportNotes] = useState(true);
  const [exportCategories, setExportCategories] = useState(true);
  
  const theme = THEME_CONFIG[currentTheme];
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  const handleConfirm = () => {
    const trimmedName = filename.trim();
    if (!trimmedName || (!exportNotes && !exportCategories)) return;
    
    const finalName = trimmedName.toLowerCase().endsWith('.json') 
      ? trimmedName 
      : `${trimmedName}.json`;
      
    onConfirm(finalName, exportNotes, exportCategories);
  };

  const isExportDisabled = !exportNotes && !exportCategories;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} />
      
      <div className="relative bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${theme.primary} text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Exportovat data</h3>
          
          <div className="w-full mb-6 text-left">
            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Název souboru</label>
            <input 
              ref={inputRef}
              type="text" 
              className="w-full px-5 py-4 bg-black/20 border-2 border-white/5 rounded-2xl focus:border-indigo-500/50 focus:ring-0 text-white font-bold transition-all" 
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="Název souboru..."
            />
          </div>

          <div className="w-full mb-8">
            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1 text-left">Co exportovat?</label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => setExportNotes(!exportNotes)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${exportNotes ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-lg flex items-center justify-center border-2 transition-all ${exportNotes ? `${theme.primary} border-transparent shadow-sm` : 'border-gray-600'}`}>
                    {exportNotes && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Poznámky</span>
                </div>
              </button>

              <button 
                onClick={() => setExportCategories(!exportCategories)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${exportCategories ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-lg flex items-center justify-center border-2 transition-all ${exportCategories ? `${theme.primary} border-transparent shadow-sm` : 'border-gray-600'}`}>
                    {exportCategories && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Kategorie</span>
                </div>
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel} 
              className="flex-1 px-4 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
            >
              Zrušit
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isExportDisabled}
              className={`flex-1 px-4 py-4 ${theme.primary} ${theme.hover} text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg ${theme.shadow} disabled:opacity-20 disabled:cursor-not-allowed`}
            >
              Exportovat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
