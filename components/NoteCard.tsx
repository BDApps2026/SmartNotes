
import React, { useMemo } from 'react';
import { Note, Category, ThemeColor } from '../types';
import { ToastType } from './Toast';
import { getNoteColor, SYSTEM_CATEGORY, DEFAULT_CATEGORY, THEME_CONFIG, WELCOME_NOTE_ID } from '../App';

interface NoteCardProps {
  note: Note;
  isAdmin: boolean;
  currentTheme: ThemeColor;
  availableCategories: Category[];
  isSelected: boolean;
  isSelectionModeActive: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onToast: (message: string, type?: ToastType) => void;
}

// Funkce pro transformaci Markdown odkazů a URL na React elementy
const LinkifiedText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  // Regex pro [text](url) a pro prosté http/https URL
  const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Přidat text před shodou
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown odkaz: [text](url)
      parts.push(
        <a 
          key={match.index} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      // Prostá URL
      parts.push(
        <a 
          key={match.index} 
          href={match[3]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-block break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = combinedRegex.lastIndex;
  }

  // Přidat zbytek textu
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
};

// Definice stylů: Pozadí je vždy stejné (tmavé), mění se pouze barva a intenzita rámečku
export const NOTE_STYLE_MAP: Record<string, string> = {
  'bg-white': 'bg-[#0f172a] border-gray-700 text-gray-100 shadow-xl',
  'bg-slate-500': 'bg-[#0f172a] border-slate-500 text-slate-100 shadow-[0_0_15px_rgba(100,116,139,0.2)]',
  'bg-blue-500': 'bg-[#0f172a] border-blue-500 text-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
  'bg-emerald-500': 'bg-[#0f172a] border-emerald-500 text-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  'bg-amber-500': 'bg-[#0f172a] border-amber-500 text-amber-50 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  'bg-orange-500': 'bg-[#0f172a] border-orange-500 text-orange-50 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
  'bg-rose-500': 'bg-[#0f172a] border-rose-500 text-rose-50 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
  'bg-violet-500': 'bg-[#0f172a] border-violet-500 text-violet-50 shadow-[0_0_15px_rgba(139,92,246,0.2)]',
  'bg-cyan-500': 'bg-[#0f172a] border-cyan-500 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
  'bg-indigo-500': 'bg-[#0f172a] border-indigo-500 text-indigo-50 shadow-[0_0_15px_rgba(79,70,229,0.2)]',
  'bg-fuchsia-500': 'bg-[#0f172a] border-fuchsia-500 text-fuchsia-50 shadow-[0_0_15px_rgba(217,70,239,0.2)]',
};

export const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  isAdmin,
  currentTheme,
  availableCategories, 
  isSelected, 
  isSelectionModeActive,
  onSelect,
  onClick, 
  onDelete, 
  onPin, 
  onToast 
}) => {
  const isSystemNote = note.categories.includes(SYSTEM_CATEGORY) || note.id === WELCOME_NOTE_ID;
  const isWelcomeNote = note.id === WELCOME_NOTE_ID;
  const theme = THEME_CONFIG[currentTheme];
  const canBeSelected = !isSystemNote || isAdmin;
  
  const dateStr = new Date(note.updatedAt).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const resolvedColor = getNoteColor(note.categories, availableCategories);
  const currentStyle = NOTE_STYLE_MAP[resolvedColor] || NOTE_STYLE_MAP['bg-white'];

  const sortedNoteCategories = useMemo(() => {
    if (note.categories.length === 0) return [DEFAULT_CATEGORY];
    return [...note.categories].sort((a, b) => {
      const catA = availableCategories.find(c => c.name === a);
      const catB = availableCategories.find(c => c.name === b);
      const isAPinned = catA?.isPinned || false;
      const isBPinned = catB?.isPinned || false;
      
      if (isAPinned && !isBPinned) return -1;
      if (!isAPinned && isBPinned) return 1;
      return a.localeCompare(b, 'cs');
    });
  }, [note.categories, availableCategories]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`).then(() => onToast('Zkopírováno'));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: note.title || 'Poznámka',
      text: note.content,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        onToast('Sdílení zahájeno');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          onToast('Sdílení se nezdařilo', 'error');
        }
      }
    } else {
      handleCopy(e);
      onToast('Sdílení není podporováno, text byl zkopírován', 'info');
    }
  };

  const isProtectedNote = isSystemNote && !isAdmin;

  return (
    <div 
      onClick={onClick} 
      className={`group relative p-6 rounded-[2.2rem] transition-all duration-300 border-[3px] ${isSystemNote ? 'animate-pulse-subtle border-amber-500/50' : ''} ${isProtectedNote && !isSelectionModeActive ? 'cursor-default' : 'cursor-pointer active:scale-[0.98] hover:brightness-110'} ${currentStyle} flex flex-col h-full ease-out min-h-[340px] ${isSelected ? `ring-4 ${theme.ring} !border-white scale-[1.02] z-10` : ''}`}
    >
      {isSelectionModeActive && canBeSelected && (
        <div 
          onClick={(e) => { e.stopPropagation(); onSelect(note.id, e); }}
          className={`absolute -top-1.5 -left-1.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all z-20 ${isSelected ? `${theme.primary} border-white shadow-lg scale-110` : 'bg-gray-800 border-gray-600 group-hover:border-gray-400'}`}
        >
          {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2.5 pr-10 overflow-hidden min-h-[32px]">
          {isSystemNote && (
            <div className={`flex items-center justify-center shrink-0 w-6 h-6 bg-amber-500/20 text-amber-500 rounded-lg`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          )}
          <h3 className={`font-black text-xl line-clamp-2 leading-tight tracking-tight ${!note.title ? 'opacity-40 italic' : ''}`}>{note.title || '(Bez názvu)'}</h3>
        </div>
        <div className="absolute top-5 right-5">
          <button onClick={(e) => { e.stopPropagation(); onPin(note.id); }} className={`inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all ${note.isPinned ? `${theme.text} bg-white/10` : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-white/10'}`}><svg className="w-5 h-5" fill={note.isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg></button>
        </div>
      </div>
      
      {note.summary && (
        <div className="mb-3 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] italic line-clamp-2 text-gray-300 leading-snug">{note.summary}</p>
        </div>
      )}

      <div className="text-base font-bold mb-6 line-clamp-4 flex-grow overflow-hidden leading-relaxed opacity-90 whitespace-pre-wrap">
        {note.content ? <LinkifiedText text={note.content} /> : <span className="italic opacity-30">Prázdná poznámka...</span>}
      </div>
      
      {!isWelcomeNote && (
        <div className="flex flex-wrap gap-2 mb-6 min-h-[32px]">
          {sortedNoteCategories.slice(0, 3).map(catName => (
            <span key={catName} className={`text-[10px] px-3 h-8 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 shadow-sm leading-none shrink-0 ${catName === SYSTEM_CATEGORY || catName === DEFAULT_CATEGORY ? 'bg-gray-800 text-gray-100' : 'bg-black/20 text-white'}`}>
              <div className={`w-2 h-2 rounded-full ${catName === SYSTEM_CATEGORY ? 'bg-amber-500' : (catName === DEFAULT_CATEGORY ? 'bg-slate-500' : (availableCategories.find(c => c.name === catName)?.color || 'bg-gray-400'))} shadow-sm border border-white/20`} />
              <span className="leading-none pt-[1px]">{catName}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-[11px] font-black pt-4 border-t border-dashed border-white/10 opacity-60 min-h-[52px]">
        <span className="uppercase tracking-widest">{dateStr}</span>
        <div className="flex items-center gap-1.5 shrink-0 h-9">
          {!isSelectionModeActive ? (
            <>
              <button 
                onClick={handleCopy} 
                title="Kopírovat" 
                className="inline-flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
              </button>
              
              <button 
                onClick={handleShare} 
                title="Sdílet" 
                className="inline-flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>

              {(!isSystemNote || isAdmin) && <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="inline-flex items-center justify-center w-9 h-9 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
            </>
          ) : (
             <div className="w-9 h-9" />
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; border-color: rgba(245, 158, 11, 0.4); }
          50% { opacity: 0.95; border-color: rgba(245, 158, 11, 0.8); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export const NoteListItem: React.FC<NoteCardProps> = ({
  note,
  isAdmin,
  currentTheme,
  availableCategories,
  isSelected,
  isSelectionModeActive,
  onSelect,
  onClick,
  onDelete,
  onPin,
  onToast
}) => {
  const isSystemNote = note.categories.includes(SYSTEM_CATEGORY) || note.id === WELCOME_NOTE_ID;
  const theme = THEME_CONFIG[currentTheme];
  const canBeSelected = !isSystemNote || isAdmin;
  const isProtectedNote = isSystemNote && !isAdmin;

  const dateStr = new Date(note.updatedAt).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const resolvedColor = getNoteColor(note.categories, availableCategories);
  const colorClass = resolvedColor.replace('bg-', 'border-l-');

  return (
    <div 
      onClick={onClick}
      className={`group relative flex items-center bg-gray-900/40 border-l-[6px] ${colorClass} p-4 rounded-2xl transition-all hover:bg-white/5 mb-3 border border-white/5 cursor-pointer ${isSelected ? `ring-2 ${theme.ring} bg-white/10` : ''} ${isProtectedNote && !isSelectionModeActive ? 'cursor-default opacity-80' : ''}`}
    >
      {isSelectionModeActive && canBeSelected && (
        <div 
          onClick={(e) => { e.stopPropagation(); onSelect(note.id, e); }}
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mr-4 shrink-0 ${isSelected ? `${theme.primary} border-white shadow-lg` : 'bg-gray-800 border-gray-600 group-hover:border-gray-400'}`}
        >
          {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
      )}

      <div className="flex-grow min-w-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2 min-w-0 md:w-1/3">
          <h3 className={`font-black text-sm truncate tracking-tight ${!note.title ? 'opacity-40 italic' : 'text-white'}`}>
            {note.title || '(Bez názvu)'}
          </h3>
          {note.isPinned && <div className={`${theme.text}`}><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg></div>}
        </div>
        
        <div className="text-xs font-bold text-gray-500 truncate md:w-1/3 hidden md:block">
          <LinkifiedText text={note.content} />
        </div>

        <div className="flex items-center gap-2 md:w-1/4">
          {note.categories.slice(0, 1).map(cat => (
            <span key={cat} className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 truncate max-w-[80px]">
              {cat}
            </span>
          ))}
          {note.categories.length > 1 && <span className="text-[9px] text-gray-600 font-bold">+{note.categories.length - 1}</span>}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-4 ml-4">
        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest hidden sm:block">{dateStr}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
            onClick={(e) => { e.stopPropagation(); onPin(note.id); }} 
            className={`p-2 rounded-lg hover:bg-white/10 ${note.isPinned ? theme.text : 'text-gray-500'}`}
          >
            <svg className="w-4 h-4" fill={note.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          {(!isSystemNote || isAdmin) && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} 
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
