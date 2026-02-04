
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Note, Category, ThemeColor } from '../types';
import { improveNoteWithAI, translateNoteWithAI, verifyFactsWithAI, summarizeNoteWithAI } from '../services/geminiService';
import { getNoteColor, THEME_CONFIG, SYSTEM_CATEGORY, WELCOME_NOTE_ID } from '../App';
import { ToastType } from './Toast';
import { NOTE_STYLE_MAP } from './NoteCard';
import { ConfirmDialog } from './ConfirmDialog';

interface NoteEditorProps {
  note: Note | null;
  notes: Note[];
  isAdmin?: boolean;
  currentNickname: string;
  currentTheme: ThemeColor;
  isMicEnabled: boolean;
  isAIEnabled: boolean;
  availableCategories: Category[];
  onSave: (note: Partial<Note>) => void;
  onAddCategory: (name: string, color: string) => Category | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onToast: (message: string, type?: ToastType) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note, 
  notes,
  isAdmin = false,
  currentNickname, 
  currentTheme,
  isMicEnabled,
  isAIEnabled,
  availableCategories, 
  onSave, 
  onAddCategory,
  onClose, 
  onDelete,
  onToast
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [author, setAuthor] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIMenuOpen, setIsAIMenuOpen] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  
  // Link State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // Quick Category State
  const [isAddingQuickCat, setIsAddingQuickCat] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  
  const theme = THEME_CONFIG[currentTheme];
  
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const TITLE_LIMIT = 120;
  const CONTENT_LIMIT = 30000;
  
  const isSystemNote = note?.categories.includes(SYSTEM_CATEGORY) || note?.id === WELCOME_NOTE_ID;
  const isReadOnly = isSystemNote && !isAdmin;

  const sortedCategories = useMemo(() => {
    return [...availableCategories].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.name.localeCompare(b.name, 'cs');
    });
  }, [availableCategories]);

  const adjustAllHeights = () => {
    requestAnimationFrame(() => {
      if (titleRef.current) {
        titleRef.current.style.height = 'auto';
        titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
      }
      if (contentRef.current) {
        contentRef.current.style.height = 'auto';
        contentRef.current.style.height = `${Math.max(200, contentRef.current.scrollHeight)}px`;
      }
    });
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && isMicEnabled) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'cs-CZ';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setContent(prev => {
            const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
            const newContent = prev + space + finalTranscript;
            return newContent.substring(0, CONTENT_LIMIT);
          });
          adjustAllHeights();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsDictating(false);
        if (event.error === 'not-allowed') {
          onToast('Přístup k mikrofonu byl zamítnut', 'error');
        }
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isMicEnabled]);

  const toggleDictation = () => {
    if (isReadOnly || !isMicEnabled) return;
    if (!recognitionRef.current) {
      onToast('Diktování není v tomto prohlížeči podporováno', 'error');
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
      setIsDictating(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsDictating(true);
        onToast('Naslouchám... Můžete mluvit.', 'info');
      } catch (e) {
        console.error(e);
        setIsDictating(false);
      }
    }
  };

  useEffect(() => {
    if (note) { 
      setTitle(note.title); 
      setContent(note.content); 
      setSummary(note.summary || '');
      setAuthor(note.author || ''); 
      setSelectedCategoryNames(note.categories);
      setIsPinned(note.isPinned || false);
    } else { 
      setAuthor(currentNickname); 
      setTitle(''); 
      setContent(''); 
      setSummary('');
      setSelectedCategoryNames([]); 
      setIsPinned(false);
    }
    setTimeout(adjustAllHeights, 50);
  }, [note, currentNickname]);

  const hasUnsavedChanges = useMemo(() => {
    if (isReadOnly) return false;
    const current = { title: title.trim(), content: content.trim(), categories: [...selectedCategoryNames].sort().join(',') };
    const original = note ? { title: note.title.trim(), content: note.content.trim(), categories: [...note.categories].sort().join(',') } : { title: '', content: '', categories: '' };
    return JSON.stringify(current) !== JSON.stringify(original);
  }, [title, content, selectedCategoryNames, note, isReadOnly]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) setIsAIMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAIAction = async (action: () => Promise<void>, toastMsg: string) => {
    if (isReadOnly || isProcessing || !isAIEnabled) return;
    setIsProcessing(true);
    setIsAIMenuOpen(false);
    try {
      await action();
      onToast(toastMsg, 'success');
      adjustAllHeights();
    } catch (e) {
      console.error(e);
      onToast('AI služba momentálně neodpovídá', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickCatSave = () => {
    if (!quickCatName.trim()) return;
    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCat = onAddCategory(quickCatName.trim(), randomColor);
    if (newCat) {
      setSelectedCategoryNames(prev => [...prev, newCat.name]);
      setQuickCatName('');
      setIsAddingQuickCat(false);
    }
  };

  const handleQuickCatAIRecommendation = () => {
    if (!aiRecommendation || !isAIEnabled) return;
    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCat = onAddCategory(aiRecommendation, randomColor);
    if (newCat) {
      setSelectedCategoryNames(prev => [...prev, newCat.name]);
      setAiRecommendation(null);
    }
  };

  const handleCopy = () => {
    const fullText = `${title}\n\n${content}${summary ? `\n\nShrnutí AI: ${summary}` : ''}`;
    navigator.clipboard.writeText(fullText).then(() => {
      onToast('Zkopírováno do schránky');
    });
  };

  const handleShare = async () => {
    const shareData = { title: title || 'Poznámka', text: content };
    if (navigator.share) {
      try { await navigator.share(shareData); onToast('Sdílení zahájeno'); } 
      catch (err) { if ((err as Error).name !== 'AbortError') onToast('Sdílení se nezdařilo', 'error'); }
    } else {
      handleCopy(); onToast('Sdílení není podporováno, text byl zkopírován', 'info');
    }
  };

  const handleOpenLinkModal = () => {
    if (isReadOnly) return;
    
    // Získání označeného textu pro předvyplnění
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      if (start !== end) {
        setLinkText(content.substring(start, end));
      } else {
        setLinkText('');
      }
    }
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    
    const formattedUrl = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const markdownLink = `[${linkText || linkUrl}](${formattedUrl})`;
    
    if (contentRef.current) {
      const start = contentRef.current.selectionStart;
      const end = contentRef.current.selectionEnd;
      const newContent = content.substring(0, start) + markdownLink + content.substring(end);
      setContent(newContent);
      
      // Vrátit focus do textarea
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          const newCursorPos = start + markdownLink.length;
          contentRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
    
    setShowLinkModal(false);
    adjustAllHeights();
  };

  const checkDuplicate = (): boolean => {
    const currentTitle = title.trim();
    const currentContent = content.trim();
    const currentCatsSorted = [...selectedCategoryNames].sort().join(',');

    return notes.some(n => {
      if (note && n.id === note.id) return false; // Ignorovat aktuální poznámku při úpravě
      if (n.id === WELCOME_NOTE_ID || n.categories.includes(SYSTEM_CATEGORY)) return false; // Ignorovat systémové poznámky

      const nCatsSorted = [...n.categories].sort().join(',');
      return n.title.trim() === currentTitle && 
             n.content.trim() === currentContent && 
             nCatsSorted === currentCatsSorted;
    });
  };

  const performSave = () => {
    onSave({ 
      id: note?.id, 
      title: title.trim(), 
      content: content.trim(), 
      summary: summary.trim(),
      author: author.trim() || currentNickname, 
      categories: selectedCategoryNames, 
      isPinned,
      updatedAt: Date.now() 
    });
    onToast(note?.id ? 'Změny uloženy' : 'Poznámka vytvořena');
    onClose();
  };

  const handleManualSave = () => {
    if (isReadOnly) return;
    
    if (checkDuplicate()) {
      setShowDuplicateConfirm(true);
    } else {
      performSave();
    }
  };

  const dynamicColor = getNoteColor(selectedCategoryNames, availableCategories);
  const currentStyle = NOTE_STYLE_MAP[dynamicColor] || NOTE_STYLE_MAP['bg-white'];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-0 md:p-6 z-[150]">
      <div className={`w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] ${currentStyle} border-[4px] rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}>
        
        {/* FIXNÍ HLAVIČKA S NÁZVEM */}
        <div className="flex-shrink-0 p-6 md:p-8 flex justify-between items-start gap-4 border-b border-white/5">
          <div className="flex-grow">
            <textarea 
              ref={titleRef} 
              rows={1} 
              readOnly={isReadOnly}
              maxLength={TITLE_LIMIT}
              placeholder="Název poznámky..." 
              className="text-3xl md:text-4xl font-black bg-transparent border-none focus:ring-0 w-full placeholder:text-gray-700 text-white tracking-tight resize-none py-0" 
              value={title} 
              onChange={(e) => { setTitle(e.target.value); adjustAllHeights(); }} 
            />
          </div>
          <button onClick={() => { if (hasUnsavedChanges) { setShowDiscardConfirm(true); } else { onClose(); } }} className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-grow flex flex-col min-h-0">
          {/* FIXNÍ SEKCE METADAT (Autor, Kategorie, AI Shrnutí) */}
          <div className="flex-shrink-0 px-6 md:px-8 pt-6 pb-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-gray-600 shrink-0"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              <input type="text" readOnly={isReadOnly} placeholder="Autor..." className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:text-white w-full p-0" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>

            {!isReadOnly && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {sortedCategories.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategoryNames(prev => prev.includes(cat.name) ? prev.filter(c => c !== cat.name) : [...prev, cat.name])} 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all inline-flex items-center gap-2 border ${selectedCategoryNames.includes(cat.name) ? `${theme.primary} border-transparent text-white shadow-lg` : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                      {cat.name}
                    </button>
                  ))}
                  
                  {isAddingQuickCat ? (
                    <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-2 py-1 border border-indigo-500/30">
                      <input 
                        type="text" 
                        maxLength={100}
                        className="bg-transparent border-none focus:ring-0 text-[10px] font-black text-white w-24 p-1 uppercase placeholder:text-gray-600"
                        placeholder="Název..."
                        autoFocus
                        value={quickCatName}
                        onChange={(e) => setQuickCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickCatSave();
                          if (e.key === 'Escape') setIsAddingQuickCat(false);
                        }}
                      />
                      <button onClick={handleQuickCatSave} className="text-indigo-400 hover:text-white p-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button onClick={() => setIsAddingQuickCat(false)} className="text-gray-500 hover:text-red-400 p-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingQuickCat(true)}
                      className="px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-dashed border-gray-700 text-gray-500 hover:border-gray-400 hover:text-gray-300"
                    >
                      + Nová kategorie
                    </button>
                  )}
                </div>
              </div>
            )}

            {(summary || aiRecommendation) && isAIEnabled && (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-amber-500/50 space-y-3 mb-4 shrink-0">
                {summary && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">AI Shrnutí</p>
                    <p className="text-sm italic text-gray-400 leading-relaxed">{summary}</p>
                  </div>
                )}
                {aiRecommendation && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">AI doporučuje: <span className="text-white italic">{aiRecommendation}</span></p>
                     </div>
                     <button 
                      onClick={handleQuickCatAIRecommendation}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg transition-all active:scale-95"
                     >
                       Přiřadit
                     </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SKROLOVATELNÝ OBSAH (Samotný text poznámky) */}
          <div className="flex-grow overflow-y-auto px-6 md:px-8 py-2 custom-scrollbar">
            <div className="min-h-full flex flex-col">
              <textarea 
                ref={contentRef} 
                readOnly={isReadOnly}
                maxLength={CONTENT_LIMIT}
                placeholder="Začněte psát své myšlenky..." 
                className="w-full bg-transparent border-none focus:ring-0 resize-none text-lg md:text-xl font-medium leading-relaxed placeholder:text-gray-700 text-gray-200 mb-8 min-h-[300px] flex-grow" 
                value={content} 
                onChange={(e) => { setContent(e.target.value); adjustAllHeights(); }} 
              />
            </div>
          </div>
        </div>

        {/* FIXNÍ PATIČKA S AKCEMI */}
        <div className="flex-shrink-0 p-6 bg-black/40 border-t border-white/5 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isReadOnly && (
                <>
                  {isAIEnabled && (
                    <div className="relative" ref={aiMenuRef}>
                      <button 
                        onClick={() => setIsAIMenuOpen(!isAIMenuOpen)} 
                        disabled={isProcessing}
                        className={`w-12 h-12 ${theme.primary} ${theme.hover} text-white rounded-xl font-black shadow-lg disabled:opacity-50 transition-all flex items-center justify-center group`}
                        title="AI Funkce"
                      >
                        {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="text-xs">AI</span>}
                      </button>
                      {isAIMenuOpen && (
                        <div className="absolute bottom-full left-0 mb-4 w-72 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-3 z-20 space-y-3">
                          <div>
                            <p className="px-3 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Úpravy</p>
                            <button onClick={() => handleAIAction(async () => {
                              const existingCatNames = availableCategories.map(c => c.name);
                              const res = await improveNoteWithAI(title, content, existingCatNames);
                              
                              if (res.improvedText) setContent(res.improvedText.substring(0, CONTENT_LIMIT));
                              if (res.suggestedTitle) setTitle(res.suggestedTitle);
                              if (res.summary) setSummary(res.summary);
                              
                              if (res.suggestedCategories?.length) {
                                const validSuggestions = res.suggestedCategories.filter(name => existingCatNames.includes(name));
                                setSelectedCategoryNames(prev => Array.from(new Set([...prev, ...validSuggestions])));
                              }
                              
                              if (res.newCategoryRecommendation) {
                                setAiRecommendation(res.newCategoryRecommendation);
                                onToast(`AI navrhuje novou kategorii: ${res.newCategoryRecommendation}`, 'info');
                              } else {
                                setAiRecommendation(null);
                              }
                            }, 'Vylepšeno')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors text-white font-bold text-xs flex items-center gap-2">✨ Vylepšit styl a název</button>
                            <button onClick={() => handleAIAction(async () => {
                              const res = await summarizeNoteWithAI(title, content);
                              setSummary(res);
                            }, 'Shrnutí vytvořeno')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors text-white font-bold text-xs flex items-center gap-2">📝 Vytvořit shrnutí</button>
                          </div>
                          <div>
                            <p className="px-3 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Ověřování</p>
                            <button onClick={() => handleAIAction(async () => {
                              const res = await verifyFactsWithAI(content);
                              const newContent = (content + "\n\n--- ANALÝZA FAKTŮ ---\n" + res).substring(0, CONTENT_LIMIT);
                              setContent(newContent);
                            }, 'Fakta ověřena')} className="w-full text-left px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors text-white font-bold text-xs flex items-center gap-2">🔍 Ověřit s Google Search</button>
                          </div>
                          <div>
                            <p className="px-3 pb-2 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">Překlad</p>
                            <div className="grid grid-cols-1 gap-1">
                              {[
                                { id: 'angličtina', label: 'EN Angličtina' },
                                { id: 'němčina', label: 'DE Němčina' },
                                { id: 'čeština', label: 'CZ Čeština' }
                              ].map(lang => (
                                <button key={lang.id} onClick={() => handleAIAction(async () => {
                                  const res = await translateNoteWithAI(title, content, lang.id);
                                  setTitle(res.title); setContent(res.content.substring(0, CONTENT_LIMIT));
                                }, `Přeloženo`)} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-white font-bold text-[11px] flex items-center gap-2">
                                  🌍 {lang.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isMicEnabled && (
                    <button 
                      onClick={toggleDictation} 
                      className={`w-12 h-12 rounded-xl transition-all border flex items-center justify-center shrink-0 ${isDictating ? 'bg-red-600 border-red-400 shadow-red-500/30' : 'bg-gray-800 border-white/5 text-white hover:bg-gray-700'}`} 
                      title="Diktovat"
                    >
                      <svg className={`w-5 h-5 ${isDictating ? 'animate-pulse text-white' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" />
                      </svg>
                    </button>
                  )}

                  <button 
                    onClick={handleOpenLinkModal}
                    className="w-12 h-12 bg-gray-800 border border-white/5 hover:bg-gray-700 text-gray-300 rounded-xl flex items-center justify-center transition-all active:scale-90"
                    title="Vložit odkaz"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </button>
                </>
              )}
              
              <button 
                onClick={handleCopy} 
                className="w-12 h-12 bg-gray-800 border border-white/5 hover:bg-gray-700 text-gray-300 rounded-xl flex items-center justify-center transition-all active:scale-90"
                title="Kopírovat do schránky"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
              </button>

              <button 
                onClick={handleShare} 
                className="w-12 h-12 bg-gray-800 border border-white/5 hover:bg-gray-700 text-gray-300 rounded-xl flex items-center justify-center transition-all active:scale-90"
                title="Sdílet poznámku"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>

              {note?.id && !isReadOnly && onDelete && (
                <button 
                  onClick={() => onDelete(note.id)} 
                  className="w-12 h-12 bg-red-500/10 border border-red-500/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                  title="Smazat poznámku"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
              {!isReadOnly && (
                <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className={`${content.length > CONTENT_LIMIT * 0.9 ? 'text-rose-500' : 'text-gray-500'}`}>
                    {content.length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()} znaků
                  </span>
                </div>
              )}
              {!isReadOnly && (
                <div className="flex items-center gap-4 w-full">
                  <button 
                    onClick={() => { if (hasUnsavedChanges) { setShowDiscardConfirm(true); } else { onClose(); } }} 
                    className="flex-1 sm:flex-none px-6 py-3 text-gray-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Zrušit
                  </button>
                  <button 
                    onClick={handleManualSave} 
                    className={`flex-1 sm:flex-none px-10 py-3 ${theme.primary} ${theme.hover} text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> 
                    Uložit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDiscardConfirm && (
        <ConfirmDialog
          title="Opustit editor?"
          message="Máte neuložené změny, které budou ztraceny."
          confirmText="Zahodit"
          alternativeText="Uložit a zavřít"
          isDanger={true}
          currentTheme={currentTheme}
          onConfirm={() => { setShowDiscardConfirm(false); onClose(); }}
          onCancel={() => setShowDiscardConfirm(false)}
          onAlternative={() => { setShowDiscardConfirm(false); handleManualSave(); }}
        />
      )}

      {showDuplicateConfirm && (
        <ConfirmDialog
          title="Duplicitní poznámka?"
          message="Poznámka s tímto obsahem a kategoriemi již existuje. Opravdu ji chcete uložit znovu?"
          confirmText="Uložit i tak"
          cancelText="Zrušit"
          alternativeText="Zahodit a zavřít"
          isDanger={false}
          currentTheme={currentTheme}
          onConfirm={() => { setShowDuplicateConfirm(false); performSave(); }}
          onCancel={() => setShowDuplicateConfirm(false)}
          onAlternative={() => { setShowDuplicateConfirm(false); onClose(); }}
        />
      )}

      {showLinkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLinkModal(false)} />
          <div className="relative bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full border border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Vložit odkaz</h3>
              
              <div className="w-full space-y-4 mb-8">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Text odkazu</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-black/20 border-2 border-white/5 rounded-2xl focus:border-blue-500/50 focus:ring-0 text-white font-bold transition-all" 
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Např. Klikněte zde..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Cílová URL</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-black/20 border-2 border-white/5 rounded-2xl focus:border-blue-500/50 focus:ring-0 text-white font-bold transition-all" 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
                    placeholder="https://example.com"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowLinkModal(false)} 
                  className="flex-1 px-4 py-4 bg-gray-700 hover:bg-gray-600 text-gray-200 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                >
                  Zrušit
                </button>
                <button 
                  onClick={handleAddLink}
                  disabled={!linkUrl.trim()}
                  className={`flex-1 px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-20`}
                >
                  Vložit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
