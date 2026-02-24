import React from 'react';
import { Plus } from 'lucide-react';

interface DragDropOverlayProps {
  isDragging: boolean;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="w-32 h-32 rounded-3xl bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
          <Plus className="text-emerald-500 w-16 h-16" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Lascia il tuo file .asm per continuare!
        </h2>
      </div>
    </div>
  );
};
