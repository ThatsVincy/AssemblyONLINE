import React from 'react';
import { Play, StepForward, RotateCcw, Cpu, Terminal, FileCode, Layers, Download, Upload, Command } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToolbarProps {
  onAssemble: () => void;
  onStep: () => void;
  onRun: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUpload: () => void;
  isAssembled: boolean;
  isRunning: boolean;
  fileName: string;
}

export const Toolbar = ({ onAssemble, onStep, onRun, onReset, onDownload, onUpload, isAssembled, isRunning, fileName }: ToolbarProps) => {
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
          <span className="hidden sm:inline">Step singolo</span>
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

      <div className="flex items-center gap-1 lg:gap-2 ml-auto">
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg">
          <FileCode size={12} className="text-zinc-500" />
          <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[100px] lg:max-w-[150px]">{fileName}</span>
        </div>

        <button
          onClick={onDownload}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
          title="Scarica .asm"
        >
          <Download size={14} />
        </button>

        <button
          onClick={onUpload}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
          title="Carica .asm"
        >
          <Upload size={14} />
        </button>
      </div>
    </div>
  );
};
