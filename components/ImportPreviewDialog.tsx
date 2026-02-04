
import React from 'react';
import { ThemeColor } from '../types';
import { THEME_CONFIG } from '../App';

interface ImportPreviewDialogProps {
  currentTheme: ThemeColor;
  data: {
    notesCount: number;
    categoriesCount: number;
    authors: string[];
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({ 
  currentTheme, 
  data, 
  onConfirm, 
  onCancel 
}) => {
  const theme = THEME_CONFIG[currentTheme];

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} />
      
      <div className="relative bg-gray-900 rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 ${theme.primary} text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Náhled importu</h3>
          <p className="text-gray-400 text-sm mb-8 text-center font-medium">V souboru byla nalezena následující data:</p>

          <div className="w-full grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white mb-1">{data.notesCount}</span>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Poznámek</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white mb-1">{data.categoriesCount}</span>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Kategorií</span>
            </div>
          </div>

          <div className="w-full mb-8 bg-black/20 rounded-2xl p-5 border border-white/5">
            <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-1">Nalezení autoři</label>
            <div className="flex flex-wrap gap-2">
              {data.authors.length > 0 ? (
                data.authors.map((author, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-gray-300 border border-white/5">
                    {author}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-gray-600">Neznámý autor</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onCancel} 
              className="flex-1 px-4 py-4 bg-gray-800 hover:bg-gray-700 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
            >
              Zrušit
            </button>
            <button 
              onClick={onConfirm}
              className={`flex-1 px-4 py-4 ${theme.primary} ${theme.hover} text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg ${theme.shadow}`}
            >
              Potvrdit import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
