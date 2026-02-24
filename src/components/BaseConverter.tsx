import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';

interface BaseConverterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BaseConverter: React.FC<BaseConverterProps> = ({ isOpen, onClose }) => {
  const [dec, setDec] = useState<string>('0');
  const [hex, setHex] = useState<string>('0');
  const [bin, setBin] = useState<string>('0');
  const [bits, setBits] = useState<8 | 16>(16);

  useEffect(() => {
    // Initialize
    updateFromDec('0');
  }, []);

  const updateFromDec = (value: string) => {
    if (value === '') {
      setDec('');
      setHex('');
      setBin('');
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setDec(value);
      setHex(num.toString(16).toUpperCase());
      setBin(num.toString(2));
    }
  };

  const updateFromHex = (value: string) => {
    if (value === '') {
      setDec('');
      setHex('');
      setBin('');
      return;
    }
    const num = parseInt(value, 16);
    if (!isNaN(num)) {
      setDec(num.toString(10));
      setHex(value.toUpperCase());
      setBin(num.toString(2));
    }
  };

  const updateFromBin = (value: string) => {
    if (value === '') {
      setDec('');
      setHex('');
      setBin('');
      return;
    }
    const num = parseInt(value, 2);
    if (!isNaN(num)) {
      setDec(num.toString(10));
      setHex(num.toString(16).toUpperCase());
      setBin(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold text-white">Convertitore Base</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={() => setBits(8)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                bits === 8 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              8 Bit
            </button>
            <button
              onClick={() => setBits(16)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                bits === 16 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              16 Bit
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">Decimale</label>
            <input
              type="text"
              value={dec}
              onChange={(e) => updateFromDec(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">Esadecimale</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 font-mono">0x</span>
              <input
                type="text"
                value={hex}
                onChange={(e) => updateFromHex(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 uppercase">Binario</label>
            <input
              type="text"
              value={bin}
              onChange={(e) => updateFromBin(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="0"
            />
            <div className="text-[10px] text-zinc-600 text-right font-mono mt-1">
              {bin.padStart(bits, '0').match(/.{1,4}/g)?.join(' ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
