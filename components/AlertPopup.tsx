
import React from 'react';

interface AlertPopupProps {
  title: string;
  message: string;
  onClose: () => void;
}

export const AlertPopup: React.FC<AlertPopupProps> = ({ title, message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border-2 border-amber-500/30 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 border-2 border-amber-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">{title}</h3>
          <p className="text-gray-400 font-bold mb-8 leading-relaxed">{message}</p>
          
          <button 
            onClick={onClose}
            className="w-full px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-900/20 uppercase tracking-widest text-sm"
          >
            Rozumím
          </button>
        </div>
      </div>
    </div>
  );
};
