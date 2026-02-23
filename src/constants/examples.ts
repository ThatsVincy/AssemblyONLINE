export interface Example {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'Arithmetic' | 'Strings' | 'I/O' | 'Loops';
}

export const EXAMPLES: Example[] = [
  {
    id: 'hello-world',
    title: 'Hello World',
    description: 'Stampa "Hello, World!" sul terminale usando l\'interruzione DOS 21h, funzione 09h.',
    category: 'I/O',
    code: `; Hello World in 8086 Assembly
data segment
    msg db 'Hello, World!$'
ends

code segment
start:
    ; Imposta il segmento dati
    mov ax, data
    mov ds, ax
    
    ; Funzione 09h di INT 21h: Stampa stringa
    mov dx, offset msg
    mov ah, 09h
    int 21h
    
    ; Termina il programma
    mov ax, 4c00h
    int 21h
ends

end start
`
  },
  {
    id: 'sum-numbers',
    title: 'Somma di due numeri',
    description: 'Semplice operazione aritmetica: somma due valori e salva il risultato in una variabile.',
    category: 'Arithmetic',
    code: `; Somma di due numeri
data segment
    num1 dw 10
    num2 dw 20
    result dw ?
ends

code segment
start:
    mov ax, data
    mov ds, ax
    
    mov ax, num1
    add ax, num2
    mov result, ax
    
    hlt
ends

end start
`
  },
  {
    id: 'loop-counter',
    title: 'Contatore con Loop',
    description: 'Utilizzo del registro CX per eseguire un ciclo che incrementa AX.',
    category: 'Loops',
    code: `; Esempio di Loop
code segment
start:
    mov ax, 0
    mov cx, 10    ; Esegui 10 volte
    
ciclo:
    inc ax
    loop ciclo    ; Decrementa CX e salta se non zero
    
    hlt
ends

end start
`
  },
  {
    id: 'string-char',
    title: 'Stampa Carattere',
    description: 'Stampa un singolo carattere usando la funzione 02h di INT 21h.',
    category: 'I/O',
    code: `; Stampa un carattere
code segment
start:
    mov dl, 'A'   ; Carattere da stampare
    mov ah, 02h   ; Funzione 02h: Stampa carattere
    int 21h
    
    mov dl, '!'
    int 21h
    
    hlt
ends

end start
`
  }
];

export interface TutorialStep {
  title: string;
  content: string;
  targetCode?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'intro-registers',
    title: 'Introduzione ai Registri',
    description: 'Impara le basi dei registri AX, BX, CX, DX.',
    steps: [
      {
        title: 'Cosa sono i registri?',
        content: 'I registri sono piccole aree di memoria ultra-veloce all\'interno della CPU. L\'8086 ha registri a 16 bit come AX (Accumulatore), BX (Base), CX (Contatore) e DX (Dati).',
      },
      {
        title: 'L\'istruzione MOV',
        content: 'Usa `MOV registro, valore` per caricare un dato in un registro. Prova a scrivere `MOV AX, 5` nell\'editor.',
        targetCode: 'mov ax, 5'
      },
      {
        title: 'Registri a 8 bit',
        content: 'AX può essere diviso in AH (High) e AL (Low), ognuno da 8 bit. `MOV AL, 10` caricherà 10 nella parte bassa di AX.',
        targetCode: 'mov al, 10'
      }
    ]
  },
  {
    id: 'arithmetic-basics',
    title: 'Operazioni Aritmetiche',
    description: 'Somma, sottrazione e incrementi.',
    steps: [
      {
        title: 'ADD e SUB',
        content: '`ADD AX, BX` somma il contenuto di BX ad AX. `SUB AX, 1` sottrae 1 da AX.',
      },
      {
        title: 'INC e DEC',
        content: '`INC AX` è una scorciatoia per aumentare di 1. `DEC AX` diminuisce di 1.',
        targetCode: 'inc ax'
      }
    ]
  }
];
