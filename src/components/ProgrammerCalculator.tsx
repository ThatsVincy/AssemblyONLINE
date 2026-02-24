import React, { useState } from 'react';
import { X, Calculator } from 'lucide-react';

interface ProgrammerCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgrammerCalculator: React.FC<ProgrammerCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [base, setBase] = useState<'HEX' | 'DEC' | 'OCT' | 'BIN'>('DEC');
  const [bits, setBits] = useState<8 | 16>(16);

  const handleInput = (char: string) => {
    if (display === '0') {
      setDisplay(char);
    } else {
      setDisplay(display + char);
    }
  };

  const handleClear = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleOp = (op: string) => {
    // Basic implementation for now
    setDisplay(display + op);
  };

  const calculate = () => {
    try {
      // Very basic eval, should be replaced with proper parser
      // eslint-disable-next-line no-eval
      const result = eval(display.replace(/x/g, '*'));
      setDisplay(result.toString());
    } catch (e) {
      setDisplay('Error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calculator className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold text-white">Calcolatrice</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4 text-right">
          <div className="text-xs text-zinc-500 mb-1">{base}</div>
          <div className="text-2xl font-mono text-white truncate">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {['HEX', 'DEC', 'OCT', 'BIN'].map((b) => (
            <button
              key={b}
              onClick={() => setBase(b as any)}
              className={`px-2 py-1 text-xs font-bold rounded ${
                base === b ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {['C', 'DEL', '%', '/'].map((btn) => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === 'DEL') handleBackspace();
                else handleOp(btn);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-lg transition-colors"
            >
              {btn}
            </button>
          ))}
          {['7', '8', '9', '*'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '*' ? handleOp('*') : handleInput(btn)}
              className={`font-bold py-3 rounded-lg transition-colors ${
                ['*'].includes(btn) ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-700/50 hover:bg-zinc-600/50 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          {['4', '5', '6', '-'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '-' ? handleOp('-') : handleInput(btn)}
              className={`font-bold py-3 rounded-lg transition-colors ${
                ['-'].includes(btn) ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-700/50 hover:bg-zinc-600/50 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          {['1', '2', '3', '+'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '+' ? handleOp('+') : handleInput(btn)}
              className={`font-bold py-3 rounded-lg transition-colors ${
                ['+'].includes(btn) ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-700/50 hover:bg-zinc-600/50 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
          {['0', '.', '=', 'AND'].map((btn) => (
            <button
              key={btn}
              onClick={() => btn === '=' ? calculate() : btn === 'AND' ? handleOp('&') : handleInput(btn)}
              className={`font-bold py-3 rounded-lg transition-colors ${
                ['=', 'AND'].includes(btn) ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-700/50 hover:bg-zinc-600/50 text-white'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
