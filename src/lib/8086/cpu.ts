export enum Register {
  AX = 'AX', BX = 'BX', CX = 'CX', DX = 'DX',
  SI = 'SI', DI = 'DI', BP = 'BP', SP = 'SP',
  IP = 'IP', CS = 'CS', DS = 'DS', SS = 'SS', ES = 'ES',
  FLAGS = 'FLAGS'
}

export type Flags = {
  CF: boolean; // Carry
  PF: boolean; // Parity
  AF: boolean; // Auxiliary Carry
  ZF: boolean; // Zero
  SF: boolean; // Sign
  TF: boolean; // Trap
  IF: boolean; // Interrupt
  DF: boolean; // Direction
  OF: boolean; // Overflow
};

export class CPU8086 {
  registers: Record<string, number> = {
    AX: 0, BX: 0, CX: 0, DX: 0,
    SI: 0, DI: 0, BP: 0, SP: 0xFFFE,
    IP: 0x0100, // Standard COM start or arbitrary
    CS: 0x0700, DS: 0x0700, SS: 0x0700, ES: 0x0700,
    FLAGS: 0
  };

  memory: Uint8Array = new Uint8Array(1024 * 1024); // 1MB
  flags: Flags = {
    CF: false, PF: false, AF: false, ZF: false,
    SF: false, TF: false, IF: true, DF: false, OF: false
  };

  isHalted: boolean = false;
  stdout: string[] = [];
  lastError: string | null = null;

  constructor() {
    this.reset();
  }

  reset() {
    for (const reg in this.registers) {
      this.registers[reg] = 0;
    }
    this.registers.SP = 0xFFFE;
    this.registers.IP = 0x0100;
    this.registers.CS = 0x0700;
    this.registers.DS = 0x0700;
    this.registers.SS = 0x0700;
    this.registers.ES = 0x0700;
    this.flags = {
      CF: false, PF: false, AF: false, ZF: false,
      SF: false, TF: false, IF: true, DF: false, OF: false
    };
    this.isHalted = false;
    this.stdout = [];
    this.lastError = null;
  }

  getReg(name: string): number {
    const upper = name.toUpperCase();
    if (this.registers[upper] !== undefined) return this.registers[upper];
    
    // Handle 8-bit registers
    if (upper === 'AL') return this.registers.AX & 0xFF;
    if (upper === 'AH') return (this.registers.AX >> 8) & 0xFF;
    if (upper === 'BL') return this.registers.BX & 0xFF;
    if (upper === 'BH') return (this.registers.BX >> 8) & 0xFF;
    if (upper === 'CL') return this.registers.CX & 0xFF;
    if (upper === 'CH') return (this.registers.CX >> 8) & 0xFF;
    if (upper === 'DL') return this.registers.DX & 0xFF;
    if (upper === 'DH') return (this.registers.DX >> 8) & 0xFF;
    
    return 0;
  }

  setReg(name: string, value: number) {
    const upper = name.toUpperCase();
    value &= 0xFFFF; // Ensure 16-bit

    if (this.registers[upper] !== undefined) {
      this.registers[upper] = value;
      return;
    }

    // Handle 8-bit registers
    if (upper === 'AL') {
      this.registers.AX = (this.registers.AX & 0xFF00) | (value & 0xFF);
    } else if (upper === 'AH') {
      this.registers.AX = (this.registers.AX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (upper === 'BL') {
      this.registers.BX = (this.registers.BX & 0xFF00) | (value & 0xFF);
    } else if (upper === 'BH') {
      this.registers.BX = (this.registers.BX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (upper === 'CL') {
      this.registers.CX = (this.registers.CX & 0xFF00) | (value & 0xFF);
    } else if (upper === 'CH') {
      this.registers.CX = (this.registers.CX & 0x00FF) | ((value & 0xFF) << 8);
    } else if (upper === 'DL') {
      this.registers.DX = (this.registers.DX & 0xFF00) | (value & 0xFF);
    } else if (upper === 'DH') {
      this.registers.DX = (this.registers.DX & 0x00FF) | ((value & 0xFF) << 8);
    }
  }

  getPhysicalAddress(segment: number, offset: number): number {
    return ((segment << 4) + offset) & 0xFFFFF;
  }

  readMem8(addr: number): number {
    return this.memory[addr & 0xFFFFF];
  }

  readMem16(addr: number): number {
    const low = this.readMem8(addr);
    const high = this.readMem8(addr + 1);
    return (high << 8) | low;
  }

  writeMem8(addr: number, val: number) {
    this.memory[addr & 0xFFFFF] = val & 0xFF;
  }

  writeMem16(addr: number, val: number) {
    this.writeMem8(addr, val & 0xFF);
    this.writeMem8(addr + 1, (val >> 8) & 0xFF);
  }

  updateFlags(result: number, size: 8 | 16 = 16) {
    const mask = size === 16 ? 0xFFFF : 0xFF;
    const signBit = size === 16 ? 0x8000 : 0x80;
    
    this.flags.ZF = (result & mask) === 0;
    this.flags.SF = (result & signBit) !== 0;
    
    // Simplified parity
    let p = result & 0xFF;
    let count = 0;
    for(let i=0; i<8; i++) if((p >> i) & 1) count++;
    this.flags.PF = count % 2 === 0;
  }
}
