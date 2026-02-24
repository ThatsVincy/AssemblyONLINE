import { CPU8086 } from './cpu';

export type Instruction = {
  mnemonic: string;
  args: string[];
  address: number;
  raw: string;
  lineNumber: number;
};

export type Variable = {
  name: string;
  address: number;
  type: 'DB' | 'DW';
  value: number;
};

export class Assembler {
  labels: Record<string, number> = {};
  variables: Variable[] = [];
  instructions: Instruction[] = [];
  binary: number[] = [];
  errors: string[] = [];

  assemble(code: string, startAddress: number = 0x0100): { instructions: Instruction[], labels: Record<string, number>, variables: Variable[], errors: string[] } {
    this.labels = {};
    this.variables = [];
    this.instructions = [];
    this.errors = [];
    const lines = code.split('\n');
    let currentAddress = startAddress;

    // First pass: Find labels and variables
    lines.forEach(line => {
      const clean = line.split(';')[0].trim();
      if (!clean) return;

      const tokens = clean.split(/\s+/);
      const upperTokens = tokens.map(t => t.toUpperCase());

      if (clean.endsWith(':')) {
        const labelName = clean.slice(0, -1).trim();
        this.labels[labelName] = currentAddress;
      } else if (upperTokens.includes('DB') || upperTokens.includes('DW')) {
        const dbIndex = upperTokens.indexOf('DB');
        const dwIndex = upperTokens.indexOf('DW');
        const typeIndex = dbIndex !== -1 ? dbIndex : dwIndex;
        const type = upperTokens[typeIndex] as 'DB' | 'DW';
        
        let name = "";
        let valueStr = "";

        if (typeIndex > 0) {
          name = tokens[typeIndex - 1];
        }
        
        if (tokens.length > typeIndex + 1) {
          valueStr = tokens[typeIndex + 1];
        }

        if (type) {
          let count = 1;
          if (tokens.length > typeIndex + 2 && tokens[typeIndex + 2].toUpperCase().startsWith('DUP')) {
            count = parseInt(valueStr, 10) || 1;
          }

          let value = 0;
          if (valueStr !== '?' && valueStr !== "" && count === 1) {
             if (valueStr.startsWith("'") && valueStr.endsWith("'")) {
               value = valueStr.charCodeAt(1);
             } else if (valueStr.endsWith('H') || valueStr.endsWith('h')) {
               value = parseInt(valueStr.slice(0, -1), 16);
             } else {
               value = parseInt(valueStr, 10) || 0;
             }
          }

          if (name) {
            this.variables.push({ name, address: currentAddress, type, value });
            this.labels[name] = currentAddress;
          }
          currentAddress += (type === 'DW' ? 2 : 1) * count;
        }
      } else if (upperTokens.some(t => ['SEGMENT', 'ENDS', 'END', 'ORG', 'ASSUME', 'PROC', 'ENDP', 'EQU', 'STACK', 'DATA', 'CODE'].includes(t))) {
        // Ignore segment and other directives
      } else {
        currentAddress += 3; 
      }
    });

    // Second pass: Parse instructions
    currentAddress = startAddress;
    lines.forEach((line, index) => {
      const clean = line.split(';')[0].trim();
      if (!clean) return;

      const tokens = clean.split(/\s+/);
      const upperTokens = tokens.map(t => t.toUpperCase());

      // Skip labels and directives
      if (clean.endsWith(':')) return;
      if (upperTokens.includes('DB') || upperTokens.includes('DW')) return;
      if (upperTokens.some(t => ['SEGMENT', 'ENDS', 'END', 'ORG', 'ASSUME', 'PROC', 'ENDP', 'EQU', 'STACK', 'DATA', 'CODE'].includes(t))) return;

      const mnemonic = tokens[0].toUpperCase();
      const args = tokens.slice(1).join('').split(',').map(s => s.trim()).filter(s => s !== "");

      const argCountMap: Record<string, number> = {
        'MOV': 2, 'ADD': 2, 'SUB': 2, 'CMP': 2,
        'INC': 1, 'DEC': 1, 'JMP': 1, 'JE': 1, 'JZ': 1, 'JNE': 1, 'JNZ': 1, 'INT': 1,
        'HLT': 0
      };

      if (argCountMap[mnemonic] !== undefined) {
        if (args.length !== argCountMap[mnemonic]) {
          this.errors.push(`Errore alla riga ${index + 1}: L'istruzione '${mnemonic}' richiede ${argCountMap[mnemonic]} argomenti, trovati ${args.length}`);
        }
      } else {
        this.errors.push(`Errore alla riga ${index + 1}: Istruzione non valida '${mnemonic}'`);
      }

      this.instructions.push({
        mnemonic,
        args,
        address: currentAddress,
        raw: clean,
        lineNumber: index + 1
      });
      currentAddress += 3;
    });

    return { instructions: this.instructions, labels: this.labels, variables: this.variables, errors: this.errors };
  }
}

export type HistoryEntry = {
  registers: Record<string, number>;
  flags: any;
  memoryChanges: { addr: number, val: number }[];
  stdoutLength: number;
  pc: number;
  isHalted: boolean;
};

export class Emulator {
  cpu: CPU8086;
  instructions: Instruction[] = [];
  labels: Record<string, number> = {};
  variables: Variable[] = [];
  pc: number = 0; // Index in instructions array
  history: HistoryEntry[] = [];

  constructor() {
    this.cpu = new CPU8086();
  }

  load(instructions: Instruction[], labels: Record<string, number>, variables: Variable[] = []) {
    this.cpu.reset();
    this.instructions = instructions;
    this.labels = labels;
    this.variables = variables;
    this.pc = 0;
    this.history = [];
    
    // Initialize memory with variable values
    variables.forEach(v => {
      if (v.type === 'DW') {
        this.cpu.writeMem16(v.address, v.value);
      } else {
        this.cpu.writeMem8(v.address, v.value);
      }
    });

    if (instructions.length > 0) {
      this.cpu.registers.IP = instructions[0].address;
    }
  }

  step(): boolean {
    if (this.pc >= this.instructions.length || this.cpu.isHalted) return false;

    const entry: HistoryEntry = {
      registers: { ...this.cpu.registers },
      flags: { ...this.cpu.flags },
      memoryChanges: [],
      stdoutLength: this.cpu.stdout.length,
      pc: this.pc,
      isHalted: this.cpu.isHalted
    };

    this.cpu.onMemoryWrite = (addr, oldVal, newVal) => {
      entry.memoryChanges.push({ addr, val: oldVal });
    };

    const inst = this.instructions[this.pc];
    this.execute(inst);
    this.pc++;
    
    if (this.pc < this.instructions.length) {
      this.cpu.registers.IP = this.instructions[this.pc].address;
    } else {
      // Last instruction executed, IP should point past it
      this.cpu.registers.IP += 3; 
    }

    this.cpu.onMemoryWrite = undefined;
    this.history.push(entry);

    return true;
  }

  stepBack(): boolean {
    const entry = this.history.pop();
    if (!entry) return false;

    this.cpu.registers = { ...entry.registers };
    this.cpu.flags = { ...entry.flags };
    this.pc = entry.pc;
    this.cpu.isHalted = entry.isHalted;
    this.cpu.stdout = this.cpu.stdout.slice(0, entry.stdoutLength);

    // Restore memory in reverse order
    for (let i = entry.memoryChanges.length - 1; i >= 0; i--) {
      const change = entry.memoryChanges[i];
      this.cpu.memory[change.addr] = change.val;
    }

    return true;
  }

  private getValue(arg: string): number {
    // Handle character literals like 'A'
    if (arg.startsWith("'") && arg.endsWith("'") && arg.length === 3) {
      return arg.charCodeAt(1);
    }

    // Handle OFFSET keyword
    if (arg.toUpperCase().startsWith('OFFSET ')) {
      const label = arg.slice(7).trim();
      return this.labels[label] || 0;
    }

    // Register
    const regs = ['AX','BX','CX','DX','AH','AL','BH','BL','CH','CL','DH','DL','SI','DI','BP','SP','CS','DS','SS','ES'];
    if (regs.includes(arg.toUpperCase())) {
      return this.cpu.getReg(arg);
    }

    // Label
    if (this.labels[arg] !== undefined) return this.labels[arg];

    // Hex or Dec
    let val = 0;
    if (arg.endsWith('H') || arg.endsWith('h')) {
      val = parseInt(arg.slice(0, -1), 16);
    } else {
      val = parseInt(arg, 10);
    }

    if (isNaN(val)) return 0;
    return val;
  }

  private is8BitReg(reg: string): boolean {
    return ['AH', 'AL', 'BH', 'BL', 'CH', 'CL', 'DH', 'DL'].includes(reg.toUpperCase());
  }

  private execute(inst: Instruction) {
    const { mnemonic, args } = inst;

    switch (mnemonic) {
      case 'MOV': {
        const dest = args[0];
        const src = args[1];

        const destVar = this.variables.find(v => v.name === dest);
        const srcVar = this.variables.find(v => v.name === src);

        let val = 0;
        if (srcVar) {
          val = srcVar.type === 'DW' ? this.cpu.readMem16(srcVar.address) : this.cpu.readMem8(srcVar.address);
        } else {
          val = this.getValue(src);
        }

        if (destVar) {
          if (destVar.type === 'DW') {
            this.cpu.writeMem16(destVar.address, val & 0xFFFF);
          } else {
            this.cpu.writeMem8(destVar.address, val & 0xFF);
          }
        } else {
          // Check for 8-bit register overflow
          if (this.is8BitReg(dest)) {
            if (val > 0xFF) {
              this.cpu.lastError = `Overflow: Valore ${val.toString(16)}h troppo grande per il registro a 8 bit ${dest}`;
            }
            val &= 0xFF;
          } else {
            if (val > 0xFFFF) {
              this.cpu.lastError = `Overflow: Valore ${val.toString(16)}h troppo grande per il registro a 16 bit ${dest}`;
            }
            val &= 0xFFFF;
          }
          this.cpu.setReg(dest, val);
        }
        break;
      }
      case 'ADD': {
        const dest = args[0];
        const v1 = this.cpu.getReg(dest);
        const v2 = this.getValue(args[1]);
        const res = v1 + v2;
        const size = this.is8BitReg(dest) ? 8 : 16;
        this.cpu.setReg(dest, res);
        this.cpu.updateFlags(res, size as 8 | 16);
        break;
      }
      case 'SUB': {
        const dest = args[0];
        const v1 = this.cpu.getReg(dest);
        const v2 = this.getValue(args[1]);
        const res = v1 - v2;
        const size = this.is8BitReg(dest) ? 8 : 16;
        this.cpu.setReg(dest, res);
        this.cpu.updateFlags(res, size as 8 | 16);
        break;
      }
      case 'INC': {
        const dest = args[0];
        const v = this.cpu.getReg(dest);
        const res = v + 1;
        const size = this.is8BitReg(dest) ? 8 : 16;
        this.cpu.setReg(dest, res);
        this.cpu.updateFlags(res, size as 8 | 16);
        break;
      }
      case 'DEC': {
        const dest = args[0];
        const v = this.cpu.getReg(dest);
        const res = v - 1;
        const size = this.is8BitReg(dest) ? 8 : 16;
        this.cpu.setReg(dest, res);
        this.cpu.updateFlags(res, size as 8 | 16);
        break;
      }
      case 'CMP': {
        const dest = args[0];
        const v1 = this.cpu.getReg(dest);
        const v2 = this.getValue(args[1]);
        const size = this.is8BitReg(dest) ? 8 : 16;
        this.cpu.updateFlags(v1 - v2, size as 8 | 16);
        break;
      }
      case 'JMP': {
        const target = this.getValue(args[0]);
        this.jumpTo(target);
        break;
      }
      case 'JE':
      case 'JZ': {
        if (this.cpu.flags.ZF) this.jumpTo(this.getValue(args[0]));
        break;
      }
      case 'JNE':
      case 'JNZ': {
        if (!this.cpu.flags.ZF) this.jumpTo(this.getValue(args[0]));
        break;
      }
      case 'INT': {
        const interrupt = this.getValue(args[0]);
        if (interrupt === 0x21) {
          this.handleInt21();
        }
        break;
      }
      case 'HLT': {
        this.cpu.isHalted = true;
        break;
      }
    }
  }

  private jumpTo(address: number) {
    const index = this.instructions.findIndex(i => i.address === address);
    if (index !== -1) {
      this.pc = index - 1; // -1 because step() increments it
    }
  }

  private handleInt21() {
    const ah = (this.cpu.registers.AX >> 8) & 0xFF;
    if (ah === 0x02) {
      // Print character in DL
      const char = String.fromCharCode(this.cpu.registers.DX & 0xFF);
      this.cpu.stdout.push(char);
    } else if (ah === 0x09) {
      // Print string at DS:DX ending with '$'
      let addr = this.cpu.getPhysicalAddress(this.cpu.registers.DS, this.cpu.registers.DX);
      let str = "";
      while (true) {
        const charCode = this.cpu.readMem8(addr++);
        if (charCode === 36) break; // '$'
        str += String.fromCharCode(charCode);
        if (str.length > 1000) break; // Safety
      }
      this.cpu.stdout.push(str);
    } else if (ah === 0x4C) {
      this.cpu.isHalted = true;
    }
  }
}
