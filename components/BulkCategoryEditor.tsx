
import React, { useState, useMemo } from 'react';
import { Category, ThemeColor } from '../types';
import { THEME_CONFIG } from '../App';
import { CATEGORY_COLORS } from './CategoryEditor';
import { ConfirmDialog } from './ConfirmDialog';

interface BulkCategoryEditorProps {
  categories: Category[];
  currentTheme: ThemeColor;
  onSave: (categories: Category[]) => void;
  onClose: () => void;
  onToast: (msg: string, type?: any) => void;
}

export const BulkCategoryEditor: React.FC<BulkCategoryEditorProps> = ({
  categories,
  currentTheme,
  onSave,
  onClose,
  onToast,
}) => {
  const [localCategories, setLocalCategories] = useState<Category[]>([...categories]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  
  const theme = THEME_CONFIG[currentTheme];

  const sortedLocalCategories = useMemo(() => {
    return [...localCategories].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.name.localeCompare(b.name, 'cs');
    });
  }, [localCategories]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(localCategories) !== JSON.stringify(categories);
  }, [localCategories, categories]);

  const handleUpdateName = (id: string, newName: string) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  const handleUpdateColor = (id: string, newColor: string) => {
    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, color: newColor } : c));
  };

  const handleTogglePin = (id: string) => {
    const pinnedCount = localCategories.filter(c => c.isPinned).length;
    const isAlreadyPinned = localCategories.find(c => c.id === id)?.isPinned;
    
    if (!isAlreadyPinned && pinnedCount >= 5) {
      onToast('Můžete připnout maximálně 5 kategorií', 'error');
      return;
    }

    setLocalCategories(prev => prev.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c));
  };

  const handleDeleteSingle = (id: string) => {
    setLocalCategories(prev => prev.filter(c => c.id !== id));
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const handleAddNew = () => {
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: '',
      color: 'bg-slate-500',
      isPinned: false
    };
    setLocalCategories(prev => [...prev, newCat]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === localCategories.length && localCategories.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localCategories.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDeleteAction = () => {
    setLocalCategories(prev => prev.filter(c => !selectedIds.includes(c.id)));
    onToast(`Odebráno ${selectedIds.length} kategorií`, 'info');
    setSelectedIds([]);
    setShowConfirmDelete(false);
  };

  const handleFinalSave = () => {
    const validCategories = localCategories.filter(c => c.name.trim() !== '');
    
    // Kontrola duplicit v aktuálním seznamu
    const names = validCategories.map(c => c.name.toLowerCase().trim());
    const hasDuplicates = names.some((name, index) => names.indexOf(name) !== index);

    if (hasDuplicates) {
      onToast('Seznam obsahuje duplicitní názvy kategorií', 'error');
      return;
    }

    onSave(validCategories);
    onToast('Změny kategorií byly uloženy');
    onClose();
  };

  const handleCloseClick = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const isAllSelected = localCategories.length > 0 && selectedIds.length === localCategories.length;

  return (
    <div className="fixed inset-0 z-[160] bg-gray-950 flex flex-col animate-in fade-in duration-300">
      <header className="flex-shrink-0 bg-gray-900 border-b border-white/5 px-8 py-6 flex flex-col sm:flex-row justify-between items-center shadow-xl gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={handleCloseClick} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Správa kategorií</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Úprava a hromadné mazání</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="flex-grow sm:flex-none px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2 animate-in zoom-in duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {isAllSelected ? 'Smazat vše' : `Smazat vybrané (${selectedIds.length})`}
            </button>
          )}
          <button 
            onClick={handleAddNew}
            className="flex-grow sm:flex-none px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            Přidat
          </button>
          <button 
            onClick={handleFinalSave}
            className={`flex-grow sm:flex-none px-8 py-3 ${theme.primary} ${theme.hover} text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95`}
          >
            Uložit změny
          </button>
        </div>
      </header>

      <div className="bg-gray-900/50 px-8 py-3 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isAllSelected ? `${theme.primary} border-transparent shadow-sm` : 'border-gray-600'}`}>
              {isAllSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
            </div>
            {isAllSelected ? 'Zrušit výběr' : 'Vybrat vše'}
          </button>
          
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          
          <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Smazáním kategorie se vaše poznámky NESMAŽOU, pouze se stanou nezařazenými.
          </div>
        </div>
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">Změny se projeví až po kliknutí na Uložit</p>
      </div>

      <main className="flex-grow overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4 pb-20">
          {sortedLocalCategories.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              </div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Žádné kategorie. Přidejte první kategorii.</p>
            </div>
          ) : (
            sortedLocalCategories.map((cat) => {
              const isSelected = selectedIds.includes(cat.id);
              // Zkontrolovat, jestli název není duplicitní pro vizuální zvýraznění (nepovinné, ale užitečné)
              const isDuplicateName = localCategories.filter(c => c.name.toLowerCase().trim() === cat.name.toLowerCase().trim() && c.name.trim() !== '').length > 1;

              return (
                <div 
                  key={cat.id} 
                  className={`group bg-gray-900/50 border p-4 rounded-2xl flex flex-col md:flex-row items-center gap-6 transition-all duration-300 ${isSelected ? 'border-white/20 bg-white/5 ring-1 ring-white/10 scale-[1.01]' : 'border-white/5 hover:border-white/10'} ${isDuplicateName ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <div className="shrink-0">
                    <button 
                      onClick={() => toggleSelectOne(cat.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? `${theme.primary} border-transparent shadow-lg` : 'border-gray-700 hover:border-gray-500'}`}
                    >
                      {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                    </button>
                  </div>

                  <div className="flex-grow w-full md:w-auto">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1.5 ml-1">Název kategorie</label>
                    <input 
                      type="text" 
                      placeholder="Název..." 
                      maxLength={100}
                      className={`w-full bg-black/20 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:ring-2 ${isDuplicateName ? 'ring-2 ring-red-500' : theme.ring} transition-all`} 
                      value={cat.name} 
                      onChange={(e) => handleUpdateName(cat.id, e.target.value)}
                    />
                    {isDuplicateName && <p className="text-red-500 text-[8px] font-black uppercase mt-1 ml-1 tracking-widest">Duplicitní název</p>}
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1.5 ml-1">Barva</label>
                    <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl">
                      {CATEGORY_COLORS.map(color => (
                        <button 
                          key={color.class} 
                          onClick={() => handleUpdateColor(cat.id, color.class)}
                          className={`w-6 h-6 rounded-full ${color.class} transition-all ${cat.color === color.class ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-end gap-2">
                    <button 
                      onClick={() => handleTogglePin(cat.id)}
                      className={`p-3 rounded-xl transition-all border ${cat.isPinned ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white'}`}
                      title={cat.isPinned ? "Odepnout" : "Připnout"}
                    >
                      <svg className="w-5 h-5" fill={cat.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteSingle(cat.id)}
                      className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                      title="Smazat tuto kategorii"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 bg-gray-900 border-t border-white/5 p-8 flex justify-center">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">
          Správa kategorií • Poznámky zůstávají bezpečně uloženy
        </p>
      </footer>

      {showConfirmDelete && (
        <ConfirmDialog 
          title={isAllSelected ? "Smazat všechny kategorie?" : `Smazat ${selectedIds.length} položek?`}
          message="Pozor: Tato akce je nevratná. Smazáním kategorií NEZTRATÍTE své poznámky – pouze z nich budou tyto kategorie odebrány a poznámky se stanou 'nezařazenými'."
          confirmText={isAllSelected ? "Ano, smazat vše" : "Smazat vybrané"}
          isDanger={true}
          currentTheme={currentTheme}
          onConfirm={handleBulkDeleteAction}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmDialog 
          title="Opustit správu kategorií?"
          message="Máte neuložené změny v názvech nebo barvách kategorií. Pokud odejdete nyní, tyto změny budou ztraceny."
          confirmText="Zahodit změny"
          alternativeText="Uložit a zavřít"
          isDanger={true}
          currentTheme={currentTheme}
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
          onAlternative={handleFinalSave}
        />
      )}
    </div>
  );
};
