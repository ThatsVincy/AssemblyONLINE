import React, { useState } from 'react';
import { Book, GraduationCap, Play, ChevronRight, Search, Code2 } from 'lucide-react';
import { EXAMPLES, TUTORIALS, Example, Tutorial } from '../constants/examples';
import { cn } from '../lib/utils';

interface LibraryPanelProps {
  onSelectExample: (code: string) => void;
  onSelectTutorial: (tutorial: Tutorial) => void;
  onClose: () => void;
}

export const LibraryPanel = ({ onSelectExample, onSelectTutorial, onClose }: LibraryPanelProps) => {
  const [activeTab, setActiveTab] = useState<'examples' | 'tutorials'>('examples');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExamples = EXAMPLES.filter(ex => 
    ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900 w-full lg:w-80 shadow-2xl">
      <div className="p-3 border-b border-white/10 flex items-center justify-between bg-zinc-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <Book size={14} className="text-emerald-500" />
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-200">Libreria</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 text-[9px] uppercase font-bold px-2 py-1 hover:bg-white/5 rounded"
        >
          Chiudi
        </button>
      </div>

      <div className="flex border-b border-white/10 shrink-0">
        <button
          onClick={() => setActiveTab('examples')}
          className={cn(
            "flex-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors",
            activeTab === 'examples' ? "text-emerald-500 bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Esempi
        </button>
        <button
          onClick={() => setActiveTab('tutorials')}
          className={cn(
            "flex-1 py-2 text-[9px] font-bold uppercase tracking-wider transition-colors",
            activeTab === 'tutorials' ? "text-blue-500 bg-blue-500/5" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Tutorial
        </button>
      </div>

      <div className="p-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" size={10} />
          <input
            type="text"
            placeholder="Cerca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-lg py-1.5 pl-7 pr-3 text-[10px] text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {activeTab === 'examples' ? (
          filteredExamples.map((ex) => (
            <div 
              key={ex.id}
              className="group bg-zinc-800/30 border border-white/5 rounded-xl p-2.5 hover:border-emerald-500/30 transition-all cursor-pointer"
              onClick={() => onSelectExample(ex.code)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] font-bold uppercase tracking-tighter text-emerald-500/70">{ex.category}</span>
                <Play size={8} className="text-zinc-600 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-[11px] font-bold text-zinc-200 mb-0.5">{ex.title}</h3>
              <p className="text-[9px] text-zinc-500 leading-tight line-clamp-2">{ex.description}</p>
            </div>
          ))
        ) : (
          TUTORIALS.map((tut) => (
            <div 
              key={tut.id}
              className="group bg-zinc-800/30 border border-white/5 rounded-xl p-2.5 hover:border-blue-500/30 transition-all cursor-pointer"
              onClick={() => onSelectTutorial(tut)}
            >
              <div className="flex items-center justify-between mb-0.5">
                <GraduationCap size={12} className="text-blue-500/70" />
                <ChevronRight size={10} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-[11px] font-bold text-zinc-200 mb-0.5">{tut.title}</h3>
              <p className="text-[9px] text-zinc-500 leading-tight">{tut.description}</p>
              <div className="mt-2 flex gap-1">
                {tut.steps.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/20 w-0" />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-zinc-800/30 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Code2 size={12} className="text-zinc-500" />
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Suggerimento</span>
        </div>
        <p className="text-[9px] text-zinc-600 leading-tight italic">
          "Clicca su un esempio per caricarlo. Ricorda di assemblare prima di eseguire."
        </p>
      </div>
    </div>
  );
};
