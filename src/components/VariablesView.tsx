import React from 'react';
import { Variable } from '../lib/8086/emulator';
import { CPU8086 } from '../lib/8086/cpu';
import { cn } from '../lib/utils';
import { Database } from 'lucide-react';

interface VariablesViewProps {
  variables: Variable[];
  cpu: CPU8086;
}

export const VariablesView = ({ variables, cpu }: VariablesViewProps) => {
  if (variables.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 text-center">
        <Database className="mx-auto text-zinc-700 mb-2" size={24} />
        <p className="text-xs text-zinc-500 font-medium">Nessuna variabile definita nel data segment</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-zinc-800/50 px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Variabili</h3>
        <span className="text-[10px] text-zinc-600 font-bold">{variables.length} Totale</span>
      </div>
      <div className="divide-y divide-white/5">
        {variables.map((v) => {
          const currentValue = v.type === 'DW' ? cpu.readMem16(v.address) : cpu.readMem8(v.address);
          const isChanged = currentValue !== v.value;

          return (
            <div key={v.name} className="p-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400 font-mono">{v.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 font-bold border border-white/5">
                  {v.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">
                  Indir: {v.address.toString(16).toUpperCase().padStart(4, '0')}h
                </span>
                <span className={cn(
                  "font-mono text-sm font-bold",
                  isChanged ? "text-amber-400" : "text-zinc-300"
                )}>
                  {currentValue.toString(16).toUpperCase().padStart(v.type === 'DW' ? 4 : 2, '0')}h
                  <span className="text-[10px] text-zinc-600 ml-1 font-normal">
                    ({currentValue})
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
