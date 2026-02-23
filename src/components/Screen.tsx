import React from 'react';

interface ScreenProps {
  stdout: string[];
}

export const Screen = ({ stdout }: ScreenProps) => {
  return (
    <div className="bg-black border border-white/10 rounded-xl overflow-hidden aspect-[4/3] flex flex-col">
      <div className="bg-zinc-800/50 px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Terminale DOS</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        </div>
      </div>
      <div className="flex-1 p-4 font-mono text-emerald-500 text-sm overflow-y-auto whitespace-pre-wrap leading-relaxed">
        {stdout.join('')}
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
};
