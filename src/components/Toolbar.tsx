import React from 'react';
import { Play, StepForward, StepBack, RotateCcw, FileCode, Command, Calculator, ArrowRightLeft, FileJson, Image } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToolbarProps {
  onAssemble: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onRun: () => void;
  onReset: () => void;
  onOpenConverter: () => void;
  onOpenCalculator: () => void;
  onExportHtml: () => void;
  onExportJpg: () => void;
  isAssembled: boolean;
  isRunning: boolean;
}

export const Toolbar = ({ 
  onAssemble, 
  onStep, 
  onStepBack, 
  onRun, 
  onReset, 
  onOpenConverter, 
  onOpenCalculator,
  onExportHtml,
  onExportJpg,
  isAssembled, 
  isRunning 
}: ToolbarProps) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="flex items-center gap-1 lg:gap-2 p-2 bg-zinc-900 border-b border-white/10 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1">
        <button
          onClick={onAssemble}
          className="flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
        >
          <FileCode size={14} />
          <span className="hidden sm:inline">Assembla</span>
          <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-bold text-zinc-500 group-hover:text-white/70 transition-colors">
            {isMac ? <Command size={8} /> : <span className="text-[8px]">CTRL</span>}
            <span>{isMac ? 'B' : 'F7'}</span>
          </div>
        </button>
      </div>
      
      <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

      <div className="flex items-center gap-1">
        <button
          onClick={onRun}
          disabled={!isAssembled || isRunning}
          className={cn(
            "flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium rounded-lg transition-all group",
            isAssembled && !isRunning 
              ? "text-emerald-400 hover:bg-emerald-500/10" 
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          <Play size={14} fill="currentColor" />
          <span className="hidden sm:inline">Esegui</span>
          <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-bold text-zinc-500 group-hover:text-emerald-500/70 transition-colors">
            {isMac ? <Command size={8} /> : <span className="text-[8px]">CTRL</span>}
            <span>{isMac ? '↵' : 'F9'}</span>
          </div>
        </button>

        <button
          onClick={onStepBack}
          disabled={!isAssembled || isRunning}
          className={cn(
            "flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium rounded-lg transition-all group",
            isAssembled && !isRunning 
              ? "text-amber-400 hover:bg-amber-500/10" 
              : "text-zinc-600 cursor-not-allowed"
          )}
          title="Step Indietro"
        >
          <StepBack size={14} />
        </button>

        <button
          onClick={onStep}
          disabled={!isAssembled || isRunning}
          className={cn(
            "flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium rounded-lg transition-all group",
            isAssembled && !isRunning 
              ? "text-blue-400 hover:bg-blue-500/10" 
              : "text-zinc-600 cursor-not-allowed"
          )}
        >
          <StepForward size={14} />
          <span className="hidden sm:inline">Step</span>
          <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-bold text-zinc-500 group-hover:text-blue-500/70 transition-colors">
            {isMac ? <Command size={8} /> : <span className="text-[8px]">CTRL</span>}
            <span>{isMac ? 'S' : 'F8'}</span>
          </div>
        </button>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors group"
      >
        <RotateCcw size={14} />
        <span className="hidden sm:inline">Reset</span>
        <div className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 bg-black/40 rounded text-[9px] font-bold text-zinc-500 group-hover:text-white/70 transition-colors">
          {isMac ? <Command size={8} /> : <span className="text-[8px]">CTRL</span>}
          <span>{isMac ? 'R' : 'F10'}</span>
        </div>
      </button>

      <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

      <div className="flex items-center gap-1">
        <button
          onClick={onOpenConverter}
          className="flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
          title="Convertitore Base"
        >
          <ArrowRightLeft size={14} />
          <span className="hidden lg:inline">Convertitore</span>
        </button>
        <button
          onClick={onOpenCalculator}
          className="flex items-center gap-2 px-2 lg:px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
          title="Calcolatrice"
        >
          <Calculator size={14} />
          <span className="hidden lg:inline">Calc</span>
        </button>
      </div>

      <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onExportHtml}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
          title="Esporta HTML"
        >
          <FileJson size={14} />
        </button>
        <button
          onClick={onExportJpg}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
          title="Esporta JPG"
        >
          <Image size={14} />
        </button>
      </div>
    </div>
  );
};
