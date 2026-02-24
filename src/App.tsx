import React, { useState, useCallback, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { Assembler, Emulator, Instruction, Variable } from './lib/8086/emulator';
import { RegisterView } from './components/RegisterView';
import { VariablesView } from './components/VariablesView';
import { Toolbar } from './components/Toolbar';
import { Screen } from './components/Screen';
import { LibraryPanel } from './components/LibraryPanel';
import { TutorialOverlay } from './components/TutorialOverlay';
import { BaseConverter } from './components/BaseConverter';
import { ProgrammerCalculator } from './components/ProgrammerCalculator';
import { DragDropOverlay } from './components/DragDropOverlay';
import { Tutorial } from './constants/examples';
import { Cpu, Terminal, FileCode, Layers, Info, Database, BookOpen, CheckCircle2, XCircle, AlertCircle, Download, Upload } from 'lucide-react';
import { cn } from './lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { toJpeg } from 'html-to-image';

const DEFAULT_CODE = `; 8086 Variable Swap Example
data segment
    passaggio dw ?    
ends

stack segment
    dw   128  dup(0)
ends

code segment
start:
    mov ax, 0AAAAh
    mov bx, 0BBBBh
    
    ; Store AX in variable
    mov passaggio, ax
    
    ; Swap values using variable
    mov ax, bx
    mov bx, passaggio
    
    hlt
ends

end start
`;

const assemblyMode = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.peek() === ";") {
      stream.skipToEnd();
      return "comment";
    }
    
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/)) {
      return "labelName";
    }

    let word = stream.match(/^[a-zA-Z0-9_']+/);
    if (word) {
      let w = word[0].toUpperCase();
      const mnemonics = ['MOV', 'ADD', 'SUB', 'INC', 'DEC', 'CMP', 'MUL', 'DIV', 'JMP', 'JE', 'JZ', 'JNE', 'JNZ', 'INT', 'HLT', 'DB', 'DW', 'SEGMENT', 'ENDS', 'END', 'ORG', 'ASSUME', 'PROC', 'ENDP', 'EQU', 'DUP', 'PUSH', 'POP', 'CALL', 'RET', 'LOOP'];
      const registers = ['AX', 'BX', 'CX', 'DX', 'AH', 'AL', 'BH', 'BL', 'CH', 'CL', 'DH', 'DL', 'SI', 'DI', 'BP', 'SP', 'CS', 'DS', 'ES', 'SS', 'IP'];
      
      if (mnemonics.includes(w)) return "keyword";
      if (registers.includes(w)) return "variableName";
      if (/^[0-9]+[hH]?$/.test(w) || (w.startsWith("'") && w.endsWith("'"))) return "number";
      return "atom";
    }
    
    stream.next();
    return null;
  }
});

const assemblyHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#a1a1aa" }, // zinc-400 (Light Gray)
  { tag: tags.keyword, color: "#047857", fontWeight: "bold" }, // emerald-700 (Darker Green)
  { tag: tags.variableName, color: "#059669" }, // emerald-600
  { tag: tags.number, color: "#d97706" }, // amber-600 (Darker Amber)
  { tag: tags.labelName, color: "#db2777" }, // pink-600 (Darker Pink)
  { tag: tags.atom, color: "#52525b" }, // zinc-600
  { tag: tags.string, color: "#d97706" }
]);

const addLineHighlight = StateEffect.define<number>();

const lineHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(lines, tr) {
    lines = lines.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addLineHighlight)) {
        if (e.value > 0) {
          lines = Decoration.set([
            Decoration.line({
              attributes: { class: "bg-emerald-500/20 border-l-2 border-emerald-500" }
            }).range(tr.state.doc.line(e.value).from)
          ]);
        } else {
          lines = Decoration.none;
        }
      }
    }
    return lines;
  },
  provide: f => EditorView.decorations.from(f)
});

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [isAssembled, setIsAssembled] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [currentIp, setCurrentIp] = useState(0x0100);
  const [registers, setRegisters] = useState<Record<string, number>>({
    AX: 0, BX: 0, CX: 0, DX: 0, SI: 0, DI: 0, BP: 0, SP: 0xFFFE, IP: 0x0100, CS: 0x0700, DS: 0x0700, SS: 0x0700, ES: 0x0700
  });
  const [prevRegisters, setPrevRegisters] = useState<Record<string, number>>({});
  const [stdout, setStdout] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("File locale.asm");
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [isHalted, setIsHalted] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [showConverter, setShowConverter] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  const assemblerRef = useRef(new Assembler());
  const emulatorRef = useRef(new Emulator());
  const editorRef = useRef<EditorView | null>(null);
  const runIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const haltTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const updateState = useCallback(() => {
    setPrevRegisters(registers);
    setRegisters({ ...emulatorRef.current.cpu.registers });
    const ip = emulatorRef.current.cpu.registers.IP;
    setCurrentIp(ip);
    setStdout([...emulatorRef.current.cpu.stdout]);
    
    if (emulatorRef.current.cpu.isHalted && !isHalted) {
      setIsHalted(true);
      if (haltTimeoutRef.current) clearTimeout(haltTimeoutRef.current);
      haltTimeoutRef.current = setTimeout(() => {
        setIsHalted(false);
      }, 15000);
    }
    
    if (emulatorRef.current.cpu.lastError) {
      setErrors(prev => [...new Set([...prev, emulatorRef.current.cpu.lastError!])]);
    }

    // Find current line
    const currentInst = instructions.find(i => i.address === ip);
    if (currentInst) {
      setCurrentLine(currentInst.lineNumber);
    } else {
      setCurrentLine(0);
    }
  }, [registers, instructions, isHalted]);

  const handleAssemble = useCallback(() => {
    const { instructions: insts, labels, variables: vars, errors: assemblyErrors } = assemblerRef.current.assemble(code);
    
    if (assemblyErrors.length > 0) {
      setErrors(assemblyErrors);
      setIsAssembled(false);
      return;
    }

    setErrors([]);
    emulatorRef.current.load(insts, labels, vars);
    
    setInstructions(insts);
    setVariables(vars);
    setIsAssembled(true);
    setIsHalted(false);
    updateState();
  }, [code, updateState]);

  const handleStep = useCallback(() => {
    setIsRunning(true);
    const active = emulatorRef.current.step();
    updateState();
    if (!active) setIsRunning(false);
    else {
      setTimeout(() => {
        if (!runIntervalRef.current) setIsRunning(false);
      }, 200);
    }
  }, [updateState]);

  const handleStepBack = useCallback(() => {
    const success = emulatorRef.current.stepBack();
    if (success) {
      updateState();
      setIsHalted(false); // If we step back from halted state
    } else {
      showNotification("Nessuno step precedente disponibile", "error");
    }
  }, [updateState, showNotification]);

  const handleRun = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    
    runIntervalRef.current = setInterval(() => {
      const active = emulatorRef.current.step();
      if (!active) {
        if (runIntervalRef.current) clearInterval(runIntervalRef.current);
        setIsRunning(false);
      }
      updateState();
    }, 50);
  }, [isRunning, updateState]);

  const handleReset = useCallback(() => {
    if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    if (haltTimeoutRef.current) clearTimeout(haltTimeoutRef.current);
    emulatorRef.current.cpu.reset();
    if (instructions.length > 0) {
      emulatorRef.current.cpu.registers.IP = instructions[0].address;
      emulatorRef.current.pc = 0;
    }
    setIsRunning(false);
    setIsHalted(false);
    setStdout([]);
    setErrors([]);
    updateState();
  }, [updateState, instructions]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.asm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code]);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
        setFileName(file.name);
        setIsAssembled(false);
        showNotification(`File "${file.name}" caricato con successo!`, 'success');
      } else {
        showNotification(`Errore nel caricamento del file.`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showNotification]);

  const handleExportHtml = useCallback(() => {
    const htmlContent = `
      <html>
        <head>
          <title>Export - ${fileName}</title>
          <style>
            body { font-family: monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
            .code { white-space: pre-wrap; }
            .output { margin-top: 20px; border-top: 1px solid #333; padding-top: 20px; color: #10b981; }
          </style>
        </head>
        <body>
          <h2>Codice Assembly</h2>
          <div class="code">${code}</div>
          <div class="output">
            <h2>Output</h2>
            <pre>${stdout.join('')}</pre>
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace('.asm', '')}_export.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, stdout, fileName]);

  const handleExportJpg = useCallback(async () => {
    if (editorRef.current) {
      try {
        const dataUrl = await toJpeg(editorRef.current.dom as HTMLElement, { quality: 0.95, backgroundColor: '#18181b' });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${fileName.replace('.asm', '')}_code.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        showNotification("Errore durante l'esportazione JPG", "error");
      }
    }
  }, [fileName, showNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.asm') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setCode(content);
          setFileName(file.name);
          setIsAssembled(false);
          showNotification(`File "${file.name}" caricato con successo!`, 'success');
        }
      };
      reader.readAsText(file);
    } else {
      showNotification("Formato file non supportato. Usa .asm o .txt", "error");
    }
  }, [showNotification]);

  const handleLogoClick = useCallback(() => {
    setLogoClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
        });
        
        const phrases = [
          "Questa webapp è mooolto meglio di emu8086 eh?",
          "La professoressa Spicchiale è la migliore!",
          "Assembly non è mai stato così verde!",
          "Chi ha bisogno di DOSBox quando hai questo?"
        ];
        // Higher chance for the requested phrase
        const random = Math.random();
        const phrase = random < 0.4 ? phrases[1] : phrases[Math.floor(Math.random() * phrases.length)];
        
        showNotification(phrase, "success");
        return 0;
      }
      return newCount;
    });
  }, [showNotification]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'F7' || (modifier && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        handleAssemble();
      }
      if (e.key === 'F8' || (modifier && e.key.toLowerCase() === 's')) {
        e.preventDefault();
        if (isAssembled && !isRunning) handleStep();
      }
      if (e.key === 'F9' || (modifier && e.key === 'Enter')) {
        e.preventDefault();
        if (isAssembled && !isRunning) handleRun();
      }
      if (e.key === 'F10' || (modifier && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAssembled, isRunning, handleStep, handleRun, handleAssemble, handleReset]);

  useEffect(() => {
    updateState();
    return () => {
      if (runIntervalRef.current) clearInterval(runIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const activeInst = document.getElementById('active-inst');
    const container = document.getElementById('trace-container');
    if (activeInst && container) {
      const containerRect = container.getBoundingClientRect();
      const instRect = activeInst.getBoundingClientRect();
      
      const relativeTop = instRect.top - containerRect.top;
      const relativeBottom = instRect.bottom - containerRect.top;

      if (relativeTop < 0) {
        container.scrollTop += relativeTop - 10;
      } else if (relativeBottom > container.clientHeight) {
        container.scrollTop += (relativeBottom - container.clientHeight) + 10;
      }
    }
  }, [currentIp]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.dispatch({ effects: addLineHighlight.of(currentLine) });
    }
  }, [currentLine]);

  return (
    <div 
      className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <DragDropOverlay isDragging={isDragging} />
      <BaseConverter isOpen={showConverter} onClose={() => setShowConverter(false)} />
      <ProgrammerCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      {/* Header */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform active:scale-95">
            <Cpu className="text-zinc-950" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase">8086 WEB IDE</h1>
            <p className="text-[10px] text-zinc-500 uppercase font-semibold tracking-widest">Emulator & Compiler</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg">
            <FileCode size={12} className="text-zinc-500" />
            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[100px] lg:max-w-[150px]">{fileName}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
              title="Scarica .asm"
            >
              <Download size={14} />
            </button>

            <button
              onClick={handleUpload}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-lg transition-colors"
              title="Carica .asm"
            >
              <Upload size={14} />
            </button>
          </div>

          <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
              showLibrary 
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
            )}
          >
            <BookOpen size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Libreria</span>
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Ideato da</span>
            <span className="text-[10px] text-emerald-500 font-bold tracking-tight">ThatsVincy_</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className={cn(
              "w-2 h-2 rounded-full", 
              isRunning ? "bg-blue-500 animate-pulse" : 
              isHalted ? "bg-red-500" :
              isAssembled ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {isRunning ? "In Esecuzione" : 
               isHalted ? "Esecuzione Terminata (HLT)" :
               isAssembled ? "Sistema Pronto" : "In Attesa"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-white/10 h-1/2 lg:h-full">
          <Toolbar 
            onAssemble={handleAssemble}
            onStep={handleStep}
            onStepBack={handleStepBack}
            onRun={handleRun}
            onReset={handleReset}
            onOpenConverter={() => setShowConverter(true)}
            onOpenCalculator={() => setShowCalculator(true)}
            onExportHtml={handleExportHtml}
            onExportJpg={handleExportJpg}
            isAssembled={isAssembled}
            isRunning={isRunning}
          />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            accept=".asm,.txt" 
            className="hidden" 
          />
          <div className="flex-1 overflow-hidden relative">
            <CodeMirror
              value={code}
              height="100%"
              theme={vscodeDark}
              extensions={[
                assemblyMode,
                syntaxHighlighting(assemblyHighlightStyle),
                lineHighlightField,
                EditorView.updateListener.of((update) => {
                  if (update.docChanged) {
                    setIsAssembled(false);
                  }
                })
              ]}
              onCreateEditor={(view) => {
                editorRef.current = view;
              }}
              onChange={(value) => setCode(value)}
              className="text-sm h-full"
            />
          </div>
          
          {/* Errors Display */}
          {errors.length > 0 && (
            <div className="bg-red-500/10 border-t border-red-500/20 p-3 space-y-1">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <Info size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Errori di Assemblaggio</span>
              </div>
              {errors.map((err, i) => (
                <p key={i} className="text-xs text-red-300/80 font-mono">{err}</p>
              ))}
            </div>
          )}

          {/* Instruction List / Debugger */}
          <div id="trace-container" className="h-48 border-t border-white/10 bg-zinc-900/30 overflow-y-auto scroll-smooth">
            <div className="sticky top-0 bg-zinc-900 z-10 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Traccia Istruzioni</span>
              <Layers size={12} className="text-zinc-600" />
            </div>
            <div className="p-2 space-y-0.5">
              {instructions.length > 0 ? instructions.map((inst, idx) => {
                const isActive = currentIp === inst.address;
                return (
                  <div 
                    key={idx}
                    id={isActive ? "active-inst" : undefined}
                    className={cn(
                      "flex items-center gap-4 px-3 py-1 rounded text-xs font-mono transition-all duration-200",
                      isActive 
                        ? "bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                        : "text-zinc-500 hover:bg-white/5"
                    )}
                  >
                    <span className="w-16 opacity-50 shrink-0">{inst.address.toString(16).toUpperCase().padStart(4, '0')}</span>
                    <span className="flex-1 font-medium truncate">{inst.raw}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                );
              }) : (
                <div className="flex flex-col items-center justify-center h-32 text-zinc-600 gap-2">
                  <Info size={24} strokeWidth={1.5} />
                  <p className="text-xs">Assembla il codice per vedere le istruzioni</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Library Panel Overlay */}
        {showLibrary && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowLibrary(false)} />
            <div className="w-full max-w-xs h-full animate-in slide-in-from-right duration-300 shadow-2xl">
              <LibraryPanel 
                onSelectExample={(newCode) => {
                  if (confirm("Caricare l'esempio sovrascriverà il codice attuale. Continuare?")) {
                    setCode(newCode);
                    setIsAssembled(false);
                    setShowLibrary(false);
                    showNotification("Esempio caricato correttamente!", "success");
                  }
                }}
                onSelectTutorial={(tut) => {
                  setActiveTutorial(tut);
                  setShowLibrary(false);
                }}
                onClose={() => setShowLibrary(false)}
              />
            </div>
          </div>
        )}

        {/* Tutorial Overlay */}
        {activeTutorial && (
          <TutorialOverlay 
            tutorial={activeTutorial}
            onClose={() => setActiveTutorial(null)}
            onCodeUpdate={(newCode) => {
              setCode(prev => prev + "\n" + newCode);
            }}
          />
        )}

        {/* Right Panel: Inspector */}
        <div className="w-full lg:w-80 flex flex-col bg-zinc-950 p-4 gap-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/10 h-1/2 lg:h-full">
          <RegisterView registers={registers} prevRegisters={prevRegisters} />
          
          <VariablesView variables={variables} cpu={emulatorRef.current.cpu} />

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Terminal size={14} className="text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Output</span>
            </div>
            <Screen stdout={stdout} />
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="bg-zinc-900/50 rounded-lg p-3 border border-white/5">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Mappa Memoria</h4>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/20 w-1/3" />
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 mt-2 leading-tight">
                Emulazione di 1MB di memoria indirizzabile. Architettura segmentata (CS:IP).
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-white/10 bg-zinc-900 px-4 flex items-center justify-between text-[10px] text-zinc-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CPU: Intel 8086
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Modalità: Real Mode
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>IP: {(currentIp || 0).toString(16).toUpperCase().padStart(4, '0')}h</span>
          <span>SP: {(registers.SP || 0).toString(16).toUpperCase().padStart(4, '0')}h</span>
        </div>
      </footer>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className={cn(
              "flex items-center gap-3 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md",
              notification.type === 'success' 
                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                : "bg-red-500/10 border-red-500/50 text-red-400"
            )}>
              {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span className="text-sm font-bold tracking-tight">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
