
import React from 'react';
import { ThemeColor } from '../types';
import { THEME_CONFIG, THEME_ORDER } from '../App';

interface SettingsDialogProps {
  currentTheme: ThemeColor;
  setCurrentTheme: (theme: ThemeColor) => void;
  isMicEnabled: boolean;
  setIsMicEnabled: (enabled: boolean) => void;
  isAIEnabled: boolean;
  setIsAIEnabled: (enabled: boolean) => void;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  currentTheme,
  setCurrentTheme,
  isMicEnabled,
  setIsMicEnabled,
  isAIEnabled,
  setIsAIEnabled,
  onClose
}) => {
  const theme = THEME_CONFIG[currentTheme];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-white/10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-8">
           <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
           </svg>
           <h3 className="text-xl font-black text-white uppercase tracking-tight">Nastavení aplikace</h3>
        </div>
        
        <div className="space-y-8">
          {/* Barevné módy - Mřížka 2 řady x 6 sloupců */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Barevný motiv</label>
            <div className="grid grid-cols-6 gap-3 bg-black/20 p-5 rounded-2xl border border-white/5 justify-items-center">
              {THEME_ORDER.map((t) => (
                <button 
                  key={t} 
                  onClick={() => setCurrentTheme(t)} 
                  className={`w-7 h-7 shrink-0 rounded-full ${THEME_CONFIG[t].dot} transition-all duration-300 ${currentTheme === t ? 'ring-2 ring-white scale-125 shadow-lg z-10' : 'opacity-40 hover:opacity-100 hover:scale-110'}`} 
                  title={t}
                />
              ))}
            </div>
          </div>

          {/* Funkce */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Funkce systému</label>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-700 text-gray-300`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
                </div>
                <p className="text-[10px] font-black uppercase text-white tracking-widest">Mikrofon</p>
              </div>
              <button onClick={() => setIsMicEnabled(!isMicEnabled)} className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isMicEnabled ? theme.primary : 'bg-gray-700'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMicEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-700 text-gray-300 w-8 h-8 flex items-center justify-center`}>
                  <span className="text-[10px] font-black">AI</span>
                </div>
                <p className="text-[10px] font-black uppercase text-white tracking-widest">AI Asistent</p>
              </div>
              <button onClick={() => setIsAIEnabled(!isAIEnabled)} className={`relative inline-flex items-center h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isAIEnabled ? theme.primary : 'bg-gray-700'}`}>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isAIEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={onClose} className={`w-full mt-10 py-4 ${theme.primary} ${theme.hover} text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]`}>Zavřít</button>
      </div>
    </div>
  );
};
