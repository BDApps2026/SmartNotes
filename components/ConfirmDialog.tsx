
import React from 'react';
import { ThemeColor } from '../types';
import { THEME_CONFIG } from '../App';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  alternativeText?: string;
  isDanger?: boolean;
  currentTheme?: ThemeColor;
  onConfirm: () => void;
  onCancel: () => void;
  onAlternative?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  title, 
  message, 
  confirmText = 'Smazat', 
  cancelText = 'Zrušit',
  alternativeText,
  isDanger = true,
  currentTheme = 'blue', 
  onConfirm, 
  onCancel,
  onAlternative
}) => {
  const theme = THEME_CONFIG[currentTheme];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />
      <div className="relative bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 ${isDanger ? 'bg-red-100/10 text-red-500' : 'bg-blue-100/10 text-blue-500'} rounded-full flex items-center justify-center mb-6`}>
            {isDanger ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-8">{message}</p>
          <div className="flex flex-col gap-3 w-full">
            {onAlternative && alternativeText && (
              <button 
                onClick={onAlternative} 
                className={`w-full inline-flex items-center justify-center px-4 py-3 ${theme.primary} ${theme.hover} text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg ${theme.shadow}`}
              >
                {alternativeText}
              </button>
            )}
            <div className="flex gap-3 w-full">
              <button onClick={onCancel} className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-2xl transition-all">
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                className={`flex-1 inline-flex items-center justify-center px-4 py-3 text-white font-bold rounded-2xl transition-all shadow-lg ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 'bg-gray-600 hover:bg-gray-500'}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
