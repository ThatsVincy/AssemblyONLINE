import React from 'react';
import { cn } from '../lib/utils';

interface RegisterItemProps {
  label: string;
  value: number;
  changed?: boolean;
  onClick?: () => void;
  isExpandable?: boolean;
  isExpanded?: boolean;
  key?: string;
}

const RegisterItem = ({ label, value = 0, changed, onClick, isExpandable, isExpanded }: RegisterItemProps) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center justify-between p-2 border-b border-white/5 last:border-0 transition-colors",
      changed && "bg-emerald-500/10",
      isExpandable && "cursor-pointer hover:bg-white/5"
    )}
  >
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-zinc-500 uppercase">{label}</span>
      {isExpandable && (
        <span className="text-[8px] text-zinc-600 font-bold uppercase">
          {isExpanded ? '▼' : '▶'}
        </span>
      )}
    </div>
    <span className="font-mono text-sm font-medium text-zinc-100">
      {(value || 0).toString(16).toUpperCase().padStart(4, '0')}h
    </span>
  </div>
);

interface RegisterViewProps {
  registers: Record<string, number>;
  prevRegisters?: Record<string, number>;
}

const REG_INFO: Record<string, { name: string, desc: string }> = {
  'AX': { name: 'Accumulator Register', desc: 'Usato per operazioni aritmetiche, logiche e di I/O.' },
  'BX': { name: 'Base Register', desc: 'Usato come puntatore di base per l\'accesso alla memoria.' },
  'CX': { name: 'Count Register', desc: 'Usato come contatore per cicli e operazioni sulle stringhe.' },
  'DX': { name: 'Data Register', desc: 'Usato per operazioni di I/O e moltiplicazioni/divisioni.' },
  'SI': { name: 'Source Index', desc: 'Puntatore sorgente per operazioni sulle stringhe.' },
  'DI': { name: 'Destination Index', desc: 'Puntatore destinazione per operazioni sulle stringhe.' },
  'BP': { name: 'Base Pointer', desc: 'Puntatore alla base dello stack frame corrente.' },
  'SP': { name: 'Stack Pointer', desc: 'Puntatore alla cima dello stack.' },
  'IP': { name: 'Instruction Pointer', desc: 'Contiene l\'offset della prossima istruzione da eseguire.' },
  'CS': { name: 'Code Segment', desc: 'Punta al segmento contenente il codice del programma.' },
  'DS': { name: 'Data Segment', desc: 'Punta al segmento contenente i dati del programma.' },
  'SS': { name: 'Stack Segment', desc: 'Punta al segmento usato per lo stack.' },
  'ES': { name: 'Extra Segment', desc: 'Segmento aggiuntivo per dati, spesso usato con SI/DI.' },
};

export const RegisterView = ({ registers, prevRegisters }: RegisterViewProps) => {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (reg: string) => {
    setExpanded(prev => ({ ...prev, [reg]: !prev[reg] }));
  };

  const mainRegs = ['AX', 'BX', 'CX', 'DX'];
  const indexRegs = ['SI', 'DI', 'BP', 'SP'];
  const segmentRegs = ['CS', 'DS', 'SS', 'ES'];
  const pointerRegs = ['IP'];

  const renderSubRegisters = (reg: string) => {
    const info = REG_INFO[reg];
    const highLabel = reg[0] + 'H';
    const lowLabel = reg[0] + 'L';
    const highValue = (registers[reg] >> 8) & 0xFF;
    const lowValue = registers[reg] & 0xFF;
    const prevHighValue = prevRegisters ? (prevRegisters[reg] >> 8) & 0xFF : highValue;
    const prevLowValue = prevRegisters ? prevRegisters[reg] & 0xFF : lowValue;

    return (
      <div className="bg-black/20 ml-2 border-l border-white/10 p-2 space-y-2">
        {info && (
          <div className="mb-2">
            <p className="text-[10px] font-bold text-emerald-500 uppercase leading-tight">{info.name}</p>
            <p className="text-[9px] text-zinc-500 leading-tight mt-0.5 italic">{info.desc}</p>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded">
            <span className="font-mono text-[10px] text-zinc-600 uppercase">{highLabel}</span>
            <span className={cn("font-mono text-xs text-zinc-400", prevHighValue !== highValue && "text-emerald-400")}>
              {highValue.toString(16).toUpperCase().padStart(2, '0')}h
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 bg-white/5 rounded">
            <span className="font-mono text-[10px] text-zinc-600 uppercase">{lowLabel}</span>
            <span className={cn("font-mono text-xs text-zinc-400", prevLowValue !== lowValue && "text-emerald-400")}>
              {lowValue.toString(16).toUpperCase().padStart(2, '0')}h
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderInfoOnly = (reg: string) => {
    const info = REG_INFO[reg];
    return (
      <div className="bg-black/20 ml-2 border-l border-white/10 p-2">
        {info && (
          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase leading-tight">{info.name}</p>
            <p className="text-[9px] text-zinc-500 leading-tight mt-0.5 italic">{info.desc}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden">
      <div className="bg-zinc-800/50 px-4 py-2 border-b border-white/10">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registri</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-4 p-2">
        <div className="space-y-0.5">
          {mainRegs.map(reg => (
            <React.Fragment key={reg}>
              <RegisterItem 
                label={reg} 
                value={registers[reg]} 
                changed={!!(prevRegisters && prevRegisters[reg] !== registers[reg])}
                isExpandable
                isExpanded={expanded[reg]}
                onClick={() => toggleExpand(reg)}
              />
              {expanded[reg] && renderSubRegisters(reg)}
            </React.Fragment>
          ))}
          <div className="h-2" />
          {pointerRegs.map(reg => (
            <React.Fragment key={reg}>
              <RegisterItem 
                label={reg} 
                value={registers[reg]} 
                changed={!!(prevRegisters && prevRegisters[reg] !== registers[reg])}
                isExpandable
                isExpanded={expanded[reg]}
                onClick={() => toggleExpand(reg)}
              />
              {expanded[reg] && renderInfoOnly(reg)}
            </React.Fragment>
          ))}
        </div>
        <div className="space-y-0.5">
          {indexRegs.map(reg => (
            <React.Fragment key={reg}>
              <RegisterItem 
                label={reg} 
                value={registers[reg]} 
                changed={!!(prevRegisters && prevRegisters[reg] !== registers[reg])}
                isExpandable
                isExpanded={expanded[reg]}
                onClick={() => toggleExpand(reg)}
              />
              {expanded[reg] && renderInfoOnly(reg)}
            </React.Fragment>
          ))}
          <div className="h-2" />
          {segmentRegs.map(reg => (
            <React.Fragment key={reg}>
              <RegisterItem 
                label={reg} 
                value={registers[reg]} 
                changed={!!(prevRegisters && prevRegisters[reg] !== registers[reg])}
                isExpandable
                isExpanded={expanded[reg]}
                onClick={() => toggleExpand(reg)}
              />
              {expanded[reg] && renderInfoOnly(reg)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
