
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Note, Category, SortOption, ThemeColor, ViewMode } from './types';
import { NoteCard, NoteListItem } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { ConfirmDialog } from './components/ConfirmDialog';
import { CategoryEditor } from './components/CategoryEditor';
import { BulkCategoryEditor } from './components/BulkCategoryEditor';
import { ExportDialog } from './components/ExportDialog';
import { ImportPreviewDialog } from './components/ImportPreviewDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { Toast, ToastType } from './components/Toast';
import { db } from './services/database';

export const WELCOME_NOTE_ID = 'welcome-note-id';
export const SAMPLE_NOTE_ID = 'sample-note-id';
export const SYSTEM_CATEGORY = 'Oznámení';
export const DEFAULT_CATEGORY = 'Nezařazeno';

const DEFAULT_WELCOME_TITLE = 'Vítejte v Smart Notes! ✨';

const AUTOSAVE_KEY = 'smart_notes_autosave_backup';
const MAX_CATEGORIES = 120;
const MAX_NOTES = 5000;
const MAX_PINNED_CATEGORIES = 5;

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Kompletní barevná specifikace v chromatickém pořadí (12 barev)
export const THEME_ORDER: ThemeColor[] = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'cyan', 'blue', 'indigo', 'violet', 'pink', 'gray'];

export const THEME_CONFIG: Record<ThemeColor, { 
  primary: string, 
  hover: string, 
  shadow: string, 
  ring: string,
  text: string,
  dot: string,
  border: string
}> = {
  red: { primary: 'bg-rose-600', hover: 'hover:bg-rose-700', shadow: 'shadow-rose-500/20', ring: 'focus:ring-rose-500', text: 'text-rose-500', dot: 'bg-rose-500', border: 'border-rose-500/50' },
  orange: { primary: 'bg-orange-600', hover: 'hover:bg-orange-700', shadow: 'shadow-orange-500/20', ring: 'focus:ring-orange-500', text: 'text-orange-500', dot: 'bg-orange-500', border: 'border-orange-500/50' },
  amber: { primary: 'bg-amber-600', hover: 'hover:bg-amber-700', shadow: 'shadow-amber-500/20', ring: 'focus:ring-amber-500', text: 'text-amber-500', dot: 'bg-amber-500', border: 'border-amber-500/50' },
  yellow: { primary: 'bg-yellow-500', hover: 'hover:bg-yellow-600', shadow: 'shadow-yellow-500/20', ring: 'focus:ring-yellow-500', text: 'text-yellow-500', dot: 'bg-yellow-500', border: 'border-yellow-500/50' },
  lime: { primary: 'bg-lime-500', hover: 'hover:bg-lime-600', shadow: 'shadow-lime-500/20', ring: 'focus:ring-lime-500', text: 'text-lime-500', dot: 'bg-lime-500', border: 'border-lime-500/50' },
  green: { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', shadow: 'shadow-emerald-500/20', ring: 'focus:ring-emerald-500', text: 'text-emerald-500', dot: 'bg-emerald-500', border: 'border-emerald-500/50' },
  cyan: { primary: 'bg-cyan-500', hover: 'hover:bg-cyan-600', shadow: 'shadow-cyan-500/20', ring: 'focus:ring-cyan-500', text: 'text-cyan-500', dot: 'bg-cyan-500', border: 'border-cyan-500/50' },
  blue: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', shadow: 'shadow-blue-500/20', ring: 'focus:ring-blue-500', text: 'text-blue-500', dot: 'bg-blue-500', border: 'border-blue-500/50' },
  indigo: { primary: 'bg-indigo-600', hover: 'hover:bg-indigo-700', shadow: 'shadow-indigo-500/20', ring: 'focus:ring-indigo-500', text: 'text-indigo-500', dot: 'bg-indigo-500', border: 'border-indigo-500/50' },
  violet: { primary: 'bg-violet-600', hover: 'hover:bg-violet-700', shadow: 'shadow-violet-500/20', ring: 'focus:ring-violet-500', text: 'text-violet-500', dot: 'bg-violet-500', border: 'border-violet-500/50' },
  pink: { primary: 'bg-fuchsia-600', hover: 'hover:bg-fuchsia-700', shadow: 'shadow-fuchsia-500/20', ring: 'focus:ring-fuchsia-500', text: 'text-fuchsia-500', dot: 'bg-fuchsia-500', border: 'border-fuchsia-500/50' },
  gray: { primary: 'bg-slate-500', hover: 'hover:bg-slate-600', shadow: 'shadow-slate-500/10', ring: 'focus:ring-slate-500', text: 'text-slate-400', dot: 'bg-slate-500', border: 'border-slate-500/30' }
};

export const getNoteColor = (categoryNames: string[], availableCategories: Category[]): string => {
  if (!categoryNames?.length) return 'bg-white';
  const found = availableCategories.find(c => c.name === categoryNames[0]);
  return found ? found.color : 'bg-white';
};

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>('blue');
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isBulkCategoryEditorOpen, setIsBulkCategoryEditorOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const adminSequenceRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const theme = THEME_CONFIG[currentTheme];

  const addToast = (message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey) {
        const key = e.key.toLowerCase();
        if (['2', 'x', 'o'].includes(key)) {
          adminSequenceRef.current = [...adminSequenceRef.current, key].slice(-3);
          if (adminSequenceRef.current.join('') === '2xo') {
            setIsAdmin(prev => {
              const newState = !prev;
              addToast(newState ? 'Admin mód aktivován 🛡️' : 'Admin mód deaktivován', newState ? 'success' : 'info');
              return newState;
            });
            adminSequenceRef.current = [];
          }
        }
      } else {
        adminSequenceRef.current = [];
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      const backup = {
        notes,
        categories: availableCategories,
        timestamp: Date.now()
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(backup));
    }, 30000);

    return () => clearInterval(interval);
  }, [notes, availableCategories, isLoaded]);

  useEffect(() => {
    const initApp = async () => {
      await db.init();
      const [savedNotes, savedCats, savedNick, savedTheme, savedViewMode, savedMic, savedAI] = await Promise.all([
        db.getAllNotes(), db.getCategories(), db.getNickname(), db.getTheme(), db.getViewMode(), db.getMicEnabled(), db.getAIEnabled()
      ]);
      setNotes(savedNotes);
      setAvailableCategories(savedCats);
      setNickname(savedNick);
      if (!savedNick) setIsEditingNickname(true);
      setCurrentTheme(savedTheme as ThemeColor || 'blue');
      setViewMode(savedViewMode as ViewMode || 'grid');
      setIsMicEnabled(savedMic);
      setIsAIEnabled(savedAI);
      setIsLoaded(true);

      if (savedNotes.length === 0) {
        const initialNotes: Note[] = [
          {
            id: WELCOME_NOTE_ID,
            title: DEFAULT_WELCOME_TITLE,
            content: 'Smart Notes je moderní digitální zápisník s AI asistencí. Zde je stručný přehled aktuálních funkcí:\n\n⚙️ NASTAVENÍ APLIKACE:\nKliknutím na ikonu ozubeného kolečka v levém panelu můžete spravovat:\n- BAREVNÝ MOTIV: Vyberte si jeden z 12 stylů mřížky.\n- FUNKCE SYSTÉMU: Možnost zapnout/vypnout AI asistenta nebo mikrofon pro diktování.\n\n📊 SYSTÉMOVÉ LIMITY:\n- KAPACITA POZNÁMEK: Aplikace bezpečně pojme až 5 000 poznámek.\n- KATEGORIE: Můžete vytvořit až 120 vlastních kategorií s unikátními barvami.\n- PŘIPNUTÍ: Do horní části seznamu můžete připnout až 5 nejdůležitějších kategorií.\n\n🤖 AI ASISTENT:\n- Pomůže s vylepšením stylu, navrhne výstižný název, vytvoří stručné shrnutí nebo ověří fakta pomocí Google vyhledávání přímo v editoru.\n\n🎙️ DIKTOVÁNÍ:\n- Pokud je mikrofon v nastavení povolen, můžete v editoru použít ikonu mikrofonu a své myšlenky jednoduše nadiktovat.\n\n⚠️ DŮLEŽITÉ UPOZORNĚNÍ K DATŮM:\n- VAŠE DATA: Všechny poznámky jsou uloženy pouze ve vašem prohlížeči (IndexedDB). Neukládejte zde citlivá hesla.\n- EXPORT: Před promazáním historie prohlížeče nebo přechodem na jiný zařízení VŽDY použijte tlačítko EXPORT.\n- IMPORT: Podporuje "štosování" – nově importované poznámky se přidají k těm stávajícím bez smazání původních.',
            summary: 'Aktuální přehled funkcí, systémových limitů a nastavení aplikace Smart Notes.',
            updatedAt: Date.now(),
            categories: [SYSTEM_CATEGORY], 
            isPinned: true,
            author: 'Tým Smart Notes'
          },
          {
            id: crypto.randomUUID(),
            title: 'Jak začít se Smart Notes? 💡',
            content: 'Vítejte! Tato poznámka je plně editovatelná a můžete ji smazat, jakmile si ji přečtete.\n\nZde je pár tipů pro začátek:\n\n1️⃣ TVORBA: Klikněte na "+ Nová poznámka" v levém panelu nebo použijte klávesové zkratky.\n\n2️⃣ EDITACE: Staají kliknout na kartu poznámky a můžete hned psát. Změny se ukládají v reálném čase do paměně prohlížeče.\n\n3️⃣ KATEGORIE: Přidávejte kategorie pro lepší přehlednost. Každá kategorie má svou barvu, která se promítne do rámečku poznámky.\n\n4️⃣ AI ASISTENT: Zkuste v editoru tlačítko "AI". Dokáže vylepšit váš text, navrhnout výstižnější název nebo vytvořit shrnutí.\n\n5️⃣ DIKTOVÁNÍ: Pokud se vám nechce psát, použijte ikonu mikrofonu a nadiktujte své myšlenky hlasem.\n\nNezapomeňte si své poznámky pravidelně zálohovat pomocí tlačítka "EXPORT" ve spodní části menu!',
            summary: 'Praktický návod pro rychlý start s aplikací Smart Notes.',
            updatedAt: Date.now() + 1000,
            categories: ['Osobní'],
            isPinned: false,
            author: 'Smart Notes'
          }
        ];
        setNotes(initialNotes);
      }
    };
    initApp();

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => { if (isLoaded) db.saveNotes(notes); }, [notes, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveCategories(availableCategories); }, [availableCategories, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveNickname(nickname); }, [nickname, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveTheme(currentTheme); }, [currentTheme, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveViewMode(viewMode); }, [viewMode, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveMicEnabled(isMicEnabled); }, [isMicEnabled, isLoaded]);
  useEffect(() => { if (isLoaded) db.saveAIEnabled(isAIEnabled); }, [isAIEnabled, isLoaded]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => addToast('Chyba při vstupu do režimu celé obrazovky', 'error'));
    } else {
      document.exitFullscreen();
    }
  };

  const userNotesCount = useMemo(() => {
    return notes.filter(n => n.id !== WELCOME_NOTE_ID && !n.categories.includes(SYSTEM_CATEGORY)).length;
  }, [notes]);

  const categoryNoteCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'all': notes.filter(n => !n.categories.includes(SYSTEM_CATEGORY) && n.id !== WELCOME_NOTE_ID).length,
      'uncategorized': notes.filter(n => n.categories.length === 0 && n.id !== WELCOME_NOTE_ID).length
    };

    availableCategories.forEach(cat => {
      counts[cat.name] = notes.filter(n => n.categories.includes(cat.name)).length;
    });

    return counts;
  }, [notes, availableCategories]);

  const notesCapacityPercent = useMemo(() => {
    return Math.min(100, (userNotesCount / MAX_NOTES) * 100);
  }, [userNotesCount]);

  const filteredNotes = useMemo(() => {
    const startTs = dateRange.start ? new Date(dateRange.start).setHours(0,0,0,0) : null;
    const endTs = dateRange.end ? new Date(dateRange.end).setHours(23,59,59,999) : null;

    return notes
      .filter(n => {
        const isSystem = n.categories.includes(SYSTEM_CATEGORY) || n.id === WELCOME_NOTE_ID;
        if (isSystem && !isAdmin) return false;

        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.content.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesCat = true;
        if (selectedCategory === DEFAULT_CATEGORY) {
            matchesCat = n.categories.length === 0 && n.id !== WELCOME_NOTE_ID;
        } else if (selectedCategory) {
            matchesCat = n.categories.includes(selectedCategory);
        }

        let matchesDate = true;
        if (startTs && n.updatedAt < startTs) matchesDate = false;
        if (endTs && n.updatedAt > endTs) matchesDate = false;

        return matchesSearch && matchesCat && matchesDate;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        if (sortBy === 'newest') return b.updatedAt - a.updatedAt;
        if (sortBy === 'oldest') return a.updatedAt - b.updatedAt;
        if (sortBy === 'az') return a.title.localeCompare(b.title);
        if (sortBy === 'za') return b.title.localeCompare(a.title);
        return 0;
      });
  }, [notes, searchQuery, selectedCategory, sortBy, isAdmin, dateRange]);

  const sortedCategories = useMemo(() => {
    const baseSorted = [...availableCategories].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return a.name.localeCompare(b.name, 'cs');
    });

    if (!categorySearchQuery) return baseSorted;
    return baseSorted.filter(cat => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()));
  }, [availableCategories, categorySearchQuery]);

  const pinnedCategoriesCount = useMemo(() => {
    return availableCategories.filter(c => c.isPinned).length;
  }, [availableCategories]);

  const selectableVisibleNoteIds = useMemo(() => {
    return filteredNotes.map(n => n.id);
  }, [filteredNotes]);

  const selectedCountInCurrentView = useMemo(() => {
    return selectedNoteIds.filter(id => selectableVisibleNoteIds.includes(id)).length;
  }, [selectedNoteIds, selectableVisibleNoteIds]);

  const isAllSelectableVisibleSelected = useMemo(() => {
    if (selectableVisibleNoteIds.length === 0) return false;
    return selectableVisibleNoteIds.every(id => selectedNoteIds.includes(id));
  }, [selectableVisibleNoteIds, selectedNoteIds]);

  const isSomeSelectableVisibleSelected = useMemo(() => {
    return selectedCountInCurrentView > 0 && !isAllSelectableVisibleSelected;
  }, [selectedCountInCurrentView, isAllSelectableVisibleSelected]);

  const handleSelectAll = () => {
    if (isAllSelectableVisibleSelected) {
      setSelectedNoteIds(prev => prev.filter(id => !selectableVisibleNoteIds.includes(id)));
    } else {
      setSelectedNoteIds(prev => Array.from(new Set([...prev, ...selectableVisibleNoteIds])));
    }
  };

  const toggleNoteSelection = (id: string) => {
    setSelectedNoteIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleBulkDeleteAction = () => {
    setNotes(prev => prev.filter(n => !selectedNoteIds.includes(n.id)));
    addToast(`Smazáno ${selectedNoteIds.length} poznámek`, 'info');
    setSelectedNoteIds([]);
    setIsSelectionMode(false);
    setBulkDeleteConfirm(false);
  };

  const handleBulkToggleCategory = (categoryName: string) => {
    if (selectedNoteIds.length === 0) return;
    
    const selectedNotes = notes.filter(n => selectedNoteIds.includes(n.id));
    const allHaveIt = selectedNoteIds.length > 0 && selectedNotes.every(n => n.categories.includes(categoryName));

    let affectedCount = 0;
    setNotes(prevNotes => prevNotes.map(note => {
      if (selectedNoteIds.includes(note.id)) {
        if (allHaveIt) {
          if (note.categories.includes(categoryName)) {
            affectedCount++;
            return { ...note, categories: note.categories.filter(c => c !== categoryName), updatedAt: Date.now() };
          }
        } else {
          if (!note.categories.includes(categoryName)) {
            affectedCount++;
            return { ...note, categories: [...note.categories, categoryName], updatedAt: Date.now() };
          }
        }
      }
      return note;
    }));

    if (allHaveIt) {
      addToast(`Kategorie "${categoryName}" odebrána z ${affectedCount} poznámek`, 'info');
    } else {
      addToast(`Kategorie "${categoryName}" přidána k ${affectedCount} poznámkám`, 'success');
    }
    
    setIsSelectionMode(false);
    setSelectedNoteIds([]);
  };

  const handleSaveNote = (noteData: Partial<Note>) => {
    if (noteData.id) {
      setNotes(prev => prev.map(n => n.id === noteData.id ? { ...n, ...noteData, updatedAt: Date.now() } as Note : n));
    } else {
      if (notes.length >= MAX_NOTES) {
        addToast(`Dosažen limit ${MAX_NOTES} poznámek. Prosím smažte nějaké staré.`, 'error');
        return;
      }
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: noteData.title || 'Bez názvu',
        content: noteData.content || '',
        summary: noteData.summary || '',
        author: nickname || 'Uživatel',
        updatedAt: Date.now(),
        categories: noteData.categories || [],
        isPinned: noteData.isPinned || false
      };
      setNotes(prev => [newNote, ...prev]);
    }
  };

  const handleNewNoteClick = () => {
    if (notes.length >= MAX_NOTES) {
      addToast(`Dosažen limit ${MAX_NOTES} poznámek. Prosím smažte nějaké staré.`, 'error');
    } else {
      setEditingNote(null);
      setIsEditorOpen(true);
    }
  };

  const openInfoNote = () => {
    const infoNote = notes.find(n => n.id === WELCOME_NOTE_ID);
    if (infoNote) {
      setEditingNote(infoNote);
      setIsEditorOpen(true);
    } else {
      addToast('Informace nejsou k dispozici', 'error');
    }
  };

  const handleExportData = (filename: string, exportNotes: boolean, exportCategories: boolean) => {
    const exportData: any = {};
    if (exportNotes) {
      const userNotes = notes.filter(n => {
        if (n.categories.includes(SYSTEM_CATEGORY) && !isAdmin) return false;
        if (n.id === WELCOME_NOTE_ID) return n.title !== DEFAULT_WELCOME_TITLE;
        return true;
      });
      exportData.notes = userNotes;
    }
    if (exportCategories) exportData.categories = availableCategories;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    addToast(`Export dokončen`);
    setIsExportDialogOpen(false);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const notesInFile = data.notes || [];
        const categoriesInFile = data.categories || [];
        const authorsInFile = Array.from(new Set(notesInFile.map((n: Note) => n.author).filter(Boolean)));
        setPendingImportData({
          raw: data,
          stats: { notesCount: notesInFile.length, categoriesCount: categoriesInFile.length, authors: authorsInFile }
        });
      } catch { addToast('Neplatný formát souboru', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    const data = pendingImportData.raw;
    let nextNotes = [...notes];
    let notesAdded = 0;
    if (data.notes) {
      data.notes.forEach((newN: Note) => {
        if (nextNotes.length < MAX_NOTES && !nextNotes.find(m => m.id === newN.id)) {
          nextNotes.push(newN);
          notesAdded++;
        }
      });
    }
    let nextCats = [...availableCategories];
    let catsAdded = 0;
    if (data.categories) {
      data.categories.forEach((newCat: Category) => {
        if (!nextCats.find(c => c.id === newCat.id || c.name === newCat.name)) {
          if (nextCats.length < MAX_CATEGORIES) { nextCats.push(newCat); catsAdded++; }
        }
      });
    }
    if (notesAdded > 0) setNotes(nextNotes);
    if (catsAdded > 0) setAvailableCategories(nextCats);
    addToast(notesAdded > 0 || catsAdded > 0 ? 'Import dokončen' : 'Žádná nová data');
    setPendingImportData(null);
  };

  const handleCreateCategory = (name: string, color: string): Category | null => {
    if (availableCategories.length >= MAX_CATEGORIES) {
      addToast(`Dosažen limit ${MAX_CATEGORIES} kategorií`, 'error');
      return null;
    }
    const newCat: Category = { id: crypto.randomUUID(), name, color, isPinned: false };
    setAvailableCategories(prev => [...prev, newCat]);
    addToast(`Kategorie "${name}" vytvořena`);
    return newCat;
  };

  const handleBulkCategorySave = (newCats: Category[]) => {
    const nameMap = new Map<string, string>();
    availableCategories.forEach(oldCat => {
      const matchingNewCat = newCats.find(nc => nc.id === oldCat.id);
      if (matchingNewCat) nameMap.set(oldCat.name, matchingNewCat.name);
    });
    const nameSet = new Set(newCats.map(c => c.name));
    setNotes(prevNotes => prevNotes.map(note => {
      if (note.id === WELCOME_NOTE_ID || note.categories.includes(SYSTEM_CATEGORY)) return note;
      const updatedCategories = note.categories
        .map(catName => nameMap.get(catName) || catName)
        .filter(catName => nameSet.has(catName));
      return { ...note, categories: Array.from(new Set(updatedCategories)) };
    }));
    setAvailableCategories(newCats);
  };

  const handleSingleCategoryDelete = (categoryToDelete: Category) => {
    setNotes(prevNotes => prevNotes.map(note => {
      if (note.id === WELCOME_NOTE_ID || note.categories.includes(SYSTEM_CATEGORY)) return note;
      return { ...note, categories: note.categories.filter(c => c !== categoryToDelete.name) };
    }));
    setAvailableCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
    if (selectedCategory === categoryToDelete.name) setSelectedCategory(null);
    setEditingCategory(null);
    addToast(`Kategorie smazána`, 'info');
  };

  if (!isLoaded) return <div className="h-screen bg-gray-950 flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[0.3em]">Smart Notes</div>;

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-950 text-gray-100 overflow-hidden font-inter">
      <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
      
      <aside className="w-full md:w-80 md:flex-shrink-0 bg-gray-900 border-r border-white/5 flex flex-col shadow-2xl z-50">
        <div className="px-8 pt-6 pb-2 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${theme.primary} rounded-xl flex items-center justify-center text-white shadow-lg transition-all duration-300`}>
              {/* Fix: Replaced duplicate strokeLinecap with strokeLinejoin to satisfy JSX rules */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Smart Notes</h1>
          </div>
          <div className="space-y-1.5 px-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] transition-colors ${userNotesCount >= MAX_NOTES * 0.9 ? 'text-red-500' : 'text-gray-500'}`}>
                Poznámky: {userNotesCount} / {MAX_NOTES}
              </span>
              <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.15em]">{Math.round(notesCapacityPercent)}%</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-500 ${notesCapacityPercent > 90 ? 'bg-red-600' : notesCapacityPercent > 70 ? 'bg-amber-500' : theme.dot}`} style={{ width: `${notesCapacityPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="px-8 pb-4 pt-2 space-y-4 shrink-0">
          <div className={`p-4 rounded-2xl transition-all duration-300 ${isEditingNickname ? 'bg-white/5 ring-1 ring-white/10' : 'hover:bg-white/5 group cursor-pointer'}`} onClick={() => !isEditingNickname && setIsEditingNickname(true)}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tvůj Profil</label>
            </div>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Jméno..." className="w-full bg-black/20 border-none rounded-xl pl-3 pr-3 py-2 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50" value={nickname} onChange={(e) => setNickname(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingNickname(false)} autoFocus />
                <button onClick={() => setIsEditingNickname(false)} className={`w-9 h-9 ${theme.primary} text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-all`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full ${theme.primary} flex items-center justify-center text-white text-[10px] font-black uppercase`}>{nickname ? nickname.charAt(0) : '?'}</div>
                <span className={`text-sm font-bold truncate ${nickname ? 'text-white' : 'text-gray-500 italic'}`}>{nickname || 'Klikni pro zadání jména'}</span>
              </div>
            )}
          </div>
          <button onClick={handleNewNoteClick} className={`w-full py-4 ${theme.primary} ${theme.hover} text-white rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Nová poznámka
          </button>
        </div>

        <div className="flex-grow flex flex-col min-h-0 overflow-hidden px-6 py-1">
          <div className="shrink-0 space-y-4 pb-4">
            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kategorie ({availableCategories.length})</p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setEditingCategory({ id: '', name: '', color: 'bg-slate-500', isPinned: false })} className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest">+ Přidat</button>
                <button onClick={() => setIsBulkCategoryEditorOpen(true)} className="p-1 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all" title="Správa kategorií">
                  {/* Category Management Icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-2 mb-2">
              <div className="relative group">
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors ${categorySearchQuery ? theme.text : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Hledat kategorii..." className={`w-full pl-9 pr-8 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[11px] font-bold text-white placeholder:text-gray-600 focus:ring-1 ${theme.ring} focus:bg-white/10 transition-all outline-none`} value={categorySearchQuery} onChange={(e) => setCategorySearchQuery(e.target.value)} />
                {categorySearchQuery && <button onClick={() => setCategorySearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>}
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-1">
            {!categorySearchQuery && (
              <button onClick={() => setSelectedCategory(null)} className={`w-full text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${!selectedCategory ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="font-bold text-sm flex-grow">Všechny</span>
                {categoryNoteCounts['all'] > 0 && <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-lg text-gray-400">{categoryNoteCounts['all']}</span>}
              </button>
            )}
            {sortedCategories.map(cat => (
              <div key={cat.id} className="group flex items-center">
                <button onClick={() => setSelectedCategory(cat.name)} className={`flex-grow text-left px-4 py-2.5 rounded-xl transition-all flex items-center gap-3 ${selectedCategory === cat.name ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
                  <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                  <span className="truncate font-bold text-sm flex-grow">{cat.name}</span>
                  {cat.isPinned && <div className="text-amber-500"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>}
                  {categoryNoteCounts[cat.name] > 0 && <span className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-lg text-gray-500">{categoryNoteCounts[cat.name]}</span>}
                </button>
                <button onClick={() => setEditingCategory(cat)} className="p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-white/5 space-y-3 shrink-0">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3">
            {/* Robust Settings Gear Icon */}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
            Nastavení aplikace
          </button>
          <div className="flex gap-2">
            <button onClick={() => setIsExportDialogOpen(true)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Export</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Import</button>
          </div>
        </div>
      </aside>

      <main className="flex-grow flex flex-col min-w-0 bg-gray-950 relative">
        <header className="relative z-[60] bg-gray-900/95 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <button onClick={openInfoNote} className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
              
              <button onClick={toggleFullscreen} className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 shrink-0" title={isFullscreen ? "Ukončit celou obrazovku" : "Režim celé obrazovky"}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={isFullscreen ? "M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" : "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15"} />
                </svg>
              </button>
            </div>
            <div className="relative flex-grow sm:w-60 group">
              <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? theme.text : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Hledat v poznámkách..." className={`w-full pl-10 pr-10 py-3 bg-white/5 border-none rounded-xl focus:ring-2 ${theme.ring} text-sm font-bold text-white placeholder:text-gray-600 transition-all`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white transition-colors" title="Smazat hledání"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>}
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? `${theme.primary} text-white shadow-lg` : 'text-gray-500 hover:text-gray-300'}`} title="Mřížka"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? `${theme.primary} text-white shadow-lg` : 'text-gray-500 hover:text-gray-300'}`} title="Seznam"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            </div>

            <div className="relative" ref={dateFilterRef}>
              <button onClick={() => setIsDateFilterOpen(!isDateFilterOpen)} className={`p-3 bg-white/5 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 shrink-0 flex items-center gap-2 ${dateRange.start || dateRange.end ? theme.text : 'text-gray-400'}`} title="Filtrovat podle data">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                {(dateRange.start || dateRange.end) && <div className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]`} />}
              </button>
              {isDateFilterOpen && (
                <div className="absolute top-full right-0 mt-2 p-5 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-[70] w-64 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">Filtr podle data</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-600 block mb-1.5 ml-1">Od dne</label>
                      <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full bg-black/40 border-none rounded-xl p-2.5 text-xs text-white focus:ring-1 focus:ring-white/20 transition-all cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-600 block mb-1.5 ml-1">Do dne</label>
                      <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full bg-black/40 border-none rounded-xl p-2.5 text-xs text-white focus:ring-1 focus:ring-white/20 transition-all cursor-pointer" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setDateRange({ start: '', end: '' }); setIsDateFilterOpen(false); addToast('Filtr data vymazán', 'info'); }} className="flex-1 py-2.5 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors">Vymazat</button>
                    <button onClick={() => setIsDateFilterOpen(false)} className={`flex-1 py-2.5 rounded-xl ${theme.primary} text-white text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all`}>Použít</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl shrink-0">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent border-none rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-300 cursor-pointer outline-none">
                <option value="newest" className="bg-gray-900">Nejnovější</option>
                <option value="oldest" className="bg-gray-900">Nejstarší</option>
                <option value="az" className="bg-gray-900">A-Z</option>
                <option value="za" className="bg-gray-900">Z-A</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 font-black text-[9px] uppercase tracking-widest">Admin</div>}
            <button onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedNoteIds([]); }} className={`px-4 py-2.5 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${isSelectionMode ? `${theme.primary} text-white border-transparent shadow-lg scale-105` : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}>
              {isSelectionMode ? 'Ukončit správu' : 'Hromadná správa'}
            </button>
          </div>
        </header>

        <div className={`relative z-[40] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] bg-gray-900/95 backdrop-blur-2xl border-b border-white/10 ${isSelectionMode ? 'h-[130px] opacity-100' : 'h-0 opacity-0 pointer-events-none'}`}>
          <div className="px-8 h-full flex flex-col justify-center overflow-hidden gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={handleSelectAll} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all group">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isAllSelectableVisibleSelected || isSomeSelectableVisibleSelected ? `${theme.primary} border-transparent shadow-sm` : 'border-gray-600 group-hover:border-gray-400'}`}>
                    {isAllSelectableVisibleSelected ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    ) : isSomeSelectableVisibleSelected ? (
                      <div className="w-2.5 h-0.5 bg-white rounded-full" />
                    ) : null}
                  </div>
                  <span className="shrink-0">{isAllSelectableVisibleSelected ? 'Zrušit výběr' : 'Vybrat vše'}</span>
                </button>
                
                <div className="h-6 w-px bg-white/10 hidden sm:block" />
                
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 hidden sm:block">Vybráno:</span>
                  <div className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 font-black text-xs ${theme.text} transition-all`}>
                    {selectedCountInCurrentView} / {selectableVisibleNoteIds.length}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setBulkDeleteConfirm(true)} 
                disabled={selectedCountInCurrentView === 0}
                className={`px-5 py-2.5 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all duration-200 border-2 flex items-center gap-2.5 shrink-0 ${
                  selectedCountInCurrentView > 0 
                    ? 'bg-red-600 hover:bg-red-700 text-white border-transparent shadow-lg shadow-red-900/40 active:scale-95' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed border-white/5 opacity-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Smazat vybrané
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-4 flex-grow overflow-hidden">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 shrink-0">Hromadná akce:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {availableCategories.map(cat => {
                    const selectedNotes = notes.filter(n => selectedNoteIds.includes(n.id));
                    const allHaveIt = selectedNoteIds.length > 0 && selectedNotes.every(n => n.categories.includes(cat.name));
                    
                    return (
                      <button 
                        key={cat.id} 
                        onClick={() => handleBulkToggleCategory(cat.name)}
                        disabled={selectedCountInCurrentView === 0}
                        title={allHaveIt ? `Hromadně odebrat kategorii "${cat.name}"` : `Hromadně přidat kategorii "${cat.name}"`}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group ${allHaveIt ? `${theme.primary} border-transparent text-white shadow-lg` : 'bg-white/5 border-white/5 text-white hover:bg-white/10'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${allHaveIt ? 'bg-white' : cat.color} transition-transform group-hover:scale-125`} />
                        {cat.name}
                        {allHaveIt && <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12" /></svg>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-8 custom-scrollbar relative z-0">
          {filteredNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
              </div>
              <h2 className="text-xl font-black uppercase tracking-widest">Žádné poznámky</h2>
              {(dateRange.start || dateRange.end) && <button onClick={() => setDateRange({ start: '', end: '' })} className={`mt-4 text-xs font-bold underline ${theme.text}`}>Zrušit filtr data</button>}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24" : "max-w-5xl mx-auto pb-24"}>
              {filteredNotes.map(note => (
                viewMode === 'grid' ? (
                  <NoteCard key={note.id} note={note} isAdmin={isAdmin} currentTheme={currentTheme} isSelected={selectedNoteIds.includes(note.id)} isSelectionModeActive={isSelectionMode} onSelect={(id) => toggleNoteSelection(id)} availableCategories={availableCategories} onClick={() => { if (isSelectionMode) toggleNoteSelection(note.id); else { setEditingNote(note); setIsEditorOpen(true); } }} onDelete={(id) => setNoteToDelete(id)} onPin={(id) => setNotes(prev => prev.map(n => n.id === id ? {...n, isPinned: !n.isPinned} : n))} onToast={addToast} />
                ) : (
                  <NoteListItem key={note.id} note={note} isAdmin={isAdmin} currentTheme={currentTheme} isSelected={selectedNoteIds.includes(note.id)} isSelectionModeActive={isSelectionMode} onSelect={(id) => toggleNoteSelection(id)} availableCategories={availableCategories} onClick={() => { if (isSelectionMode) toggleNoteSelection(note.id); else { setEditingNote(note); setIsEditorOpen(true); } }} onDelete={(id) => setNoteToDelete(id)} onPin={(id) => setNotes(prev => prev.map(n => n.id === id ? {...n, isPinned: !n.isPinned} : n))} onToast={addToast} />
                )
              ))}
            </div>
          )}
        </div>
      </main>

      {isEditorOpen && <NoteEditor note={editingNote} notes={notes} isAdmin={isAdmin} currentNickname={nickname} currentTheme={currentTheme} isMicEnabled={isMicEnabled} isAIEnabled={isAIEnabled} availableCategories={availableCategories} onSave={handleSaveNote} onAddCategory={handleCreateCategory} onClose={() => setIsEditorOpen(false)} onDelete={(id) => { setNoteToDelete(id); setIsEditorOpen(false); }} onToast={addToast} />}
      {editingCategory && <CategoryEditor category={editingCategory} existingCategories={availableCategories} currentTheme={currentTheme} pinnedCount={pinnedCategoriesCount} onSave={(id, name, color, isPinned) => { if (id) setAvailableCategories(prev => prev.map(c => c.id === id ? { ...c, name, color, isPinned } : c)); else setAvailableCategories(prev => [...prev, { id: crypto.randomUUID(), name, color, isPinned: isPinned || false }]); setEditingCategory(null); addToast('Uloženo'); }} onCancel={() => setEditingCategory(null)} onDelete={handleSingleCategoryDelete} />}
      {isBulkCategoryEditorOpen && <BulkCategoryEditor categories={availableCategories} currentTheme={currentTheme} onSave={handleBulkCategorySave} onClose={() => setIsBulkCategoryEditorOpen(false)} onToast={addToast} />}
      {isExportDialogOpen && <ExportDialog currentTheme={currentTheme} onConfirm={handleExportData} onCancel={() => setIsExportDialogOpen(false)} />}
      {isSettingsOpen && <SettingsDialog currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} isMicEnabled={isMicEnabled} setIsMicEnabled={setIsMicEnabled} isAIEnabled={isAIEnabled} setIsAIEnabled={setIsAIEnabled} onClose={() => setIsSettingsOpen(false)} />}
      {pendingImportData && <ImportPreviewDialog currentTheme={currentTheme} data={pendingImportData.stats} onConfirm={handleConfirmImport} onCancel={() => setPendingImportData(null)} />}
      {noteToDelete && <ConfirmDialog title="Smazat?" message="Akci nelze vrátit zpět." isDanger={true} currentTheme={currentTheme} onConfirm={() => { setNotes(prev => prev.filter(n => n.id !== noteToDelete)); setNoteToDelete(null); addToast('Smazáno', 'info'); }} onCancel={() => setNoteToDelete(null)} />}
      {bulkDeleteConfirm && <ConfirmDialog title={`Smazat ${selectedCountInCurrentView} položek?`} message="Vybrané poznámky budou nenávratně odstraněny z paměti prohlížeče." isDanger={true} currentTheme={currentTheme} onConfirm={handleBulkDeleteAction} onCancel={() => setBulkDeleteConfirm(false)} />}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[1000] pointer-events-none">
        {toasts.map(toast => <div key={toast.id} className="pointer-events-auto"><Toast {...toast} onClose={removeToast} /></div>)}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
