import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Lightbulb } from 'lucide-react';
import { Tutorial, TutorialStep } from '../constants/examples';
import { cn } from '../lib/utils';

interface TutorialOverlayProps {
  tutorial: Tutorial;
  onClose: () => void;
  onCodeUpdate: (code: string) => void;
}

export const TutorialOverlay = ({ tutorial, onClose, onCodeUpdate }: TutorialOverlayProps) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = tutorial.steps[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < tutorial.steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleTryCode = () => {
    if (currentStep.targetCode) {
      onCodeUpdate(currentStep.targetCode);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[60] w-96 bg-zinc-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center">
            <CheckCircle2 size={12} className="text-zinc-950" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Tutorial: {tutorial.title}</span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X size={14} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Passaggio {currentStepIdx + 1} di {tutorial.steps.length}</span>
          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${((currentStepIdx + 1) / tutorial.steps.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-zinc-100 mb-2">{currentStep.title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">{currentStep.content}</p>

        {currentStep.targetCode && (
          <button
            onClick={handleTryCode}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-500/20 transition-all mb-4"
          >
            <Lightbulb size={12} />
            Prova questo codice
          </button>
        )}

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStepIdx === 0}
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
              currentStepIdx === 0 ? "text-zinc-700" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <ChevronLeft size={14} />
            Indietro
          </button>

          {currentStepIdx === tutorial.steps.length - 1 ? (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-emerald-500 text-zinc-950 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all"
            >
              Completa
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Avanti
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
