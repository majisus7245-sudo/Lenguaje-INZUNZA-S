// Inzunza Lara Manuel de Jesus
// LyA 2 13 - 14

import type { FilaASM, FilaASMConId, FilaCO, FilaCOConId } from "../types"

type Segmento = "DATOS" | "CODIGO"

type Operando =
    | { tipo: "reg"; nombre: string; bits: 8 | 16; codigo: number }
    | { tipo: "seg"; nombre: string; codigo: number }
    | { tipo: "inm"; valor: number }
    | { tipo: "mem"; base?: string; index?: string; disp: number; simbolo?: string; bits?: 8 | 16 }

type MapaSimbolos = Map<string, number>
type MapaTamanos = Map<string, 8 | 16>

// true si el operando es de 8 bits (registro de 8 bits o variable declarada con DB).
function es8Bits(op: Operando): boolean {
    return (op.tipo === "reg" || op.tipo === "mem") && op.bits === 8
}

const REG8: Record<string, number> = { AL: 0, CL: 1, DL: 2, BL: 3, AH: 4, CH: 5, DH: 6, BH: 7 }
const REG16: Record<string, number> = { AX: 0, CX: 1, DX: 2, BX: 3, SP: 4, BP: 5, SI: 6, DI: 7 }
const SEG: Record<string, number> = { ES: 0, CS: 1, SS: 2, DS: 3 }

const RM: Record<string, number> = {
    "BX+SI": 0, "BX+DI": 1, "BP+SI": 2, "BP+DI": 3,
    "SI": 4, "DI": 5, "BP": 6, "BX": 7
}

const ALU: Record<string, { base: number; ext: number }> = {
    ADD: { base: 0x00, ext: 0 }, OR: { base: 0x08, ext: 1 },
    ADC: { base: 0x10, ext: 2 }, SBB: { base: 0x18, ext: 3 },
    AND: { base: 0x20, ext: 4 }, SUB: { base: 0x28, ext: 5 },
    XOR: { base: 0x30, ext: 6 }, CMP: { base: 0x38, ext: 7 }
}

const SALTOS: Record<string, number> = {
    JO: 0, JNO: 1, JB: 2, JAE: 3, JE: 4, JNE: 5,
    JBE: 6, JA: 7, JS: 8, JNS: 9, JP: 10, JNP: 11,
    JL: 12, JGE: 13, JLE: 14, JG: 15
}

const SIN_OPERANDOS: Record<string, number> = {
    CLC: 0xF8, STC: 0xF9, CLI: 0xFA, STI: 0xFB, CLD: 0xFC, STD: 0xFD, NOP: 0x90, RET: 0xC3
}

const DIRECTIVAS = new Set([
    "TITLE", ".MODEL", ".486", ".STACK", ".DATA", ".CODE",
    ".STARTUP", ".EXIT", "PROC", "ENDP", "END"
])

// Arma el byte ModRM juntando sus campos: mod (2 bits) | reg (3 bits) | r/m (3 bits).
function modrm(mod: number, reg: number, rm: number): number {
    return (mod << 6) | (reg << 3) | rm
}

// Separa un valor de 16 bits en 2 bytes en little-endian (parte baja primero, luego parte alta).
function bytes16(valor: number): number[] {
    return [valor & 0xFF, (valor >> 8) & 0xFF]
}

// Devuelve los bytes de un dato inmediato: 1 byte si es de 8 bits o 2 bytes si es de 16 bits.
function bytesInmediato(valor: number, bits: 8 | 16): number[] {
    return bits === 8 ? [valor & 0xFF] : bytes16(valor)
}

// Indica si un número cabe en un byte con signo (-128 a 127), por ejemplo un salto corto.
function cabeEn8(valor: number): boolean {
    return valor >= -128 && valor <= 127
}

// Convierte texto a número: hexadecimal con H (2000H), con 0X, o decimal. Devuelve null si no es número.
function parsearNumero(texto: string): number | null {
    if (/^[0-9A-F]+H$/.test(texto)) return parseInt(texto.slice(0, -1), 16)
    if (/^0X[0-9A-F]+$/.test(texto)) return parseInt(texto.slice(2), 16)
    if (/^-?[0-9]+$/.test(texto)) return parseInt(texto, 10)
    return null
}

// Separa los operandos por comas, sin cortar las comas que están dentro de una cadena entre comillas.
function dividedor(texto: string): string[] {
    const partes: string[] = []
    let actual = ""
    let comilla = false
    for (let i = 0; i < texto.length; i++) {
        const c = texto[i]
        if (c === "'") {
            if (comilla && texto[i + 1] === "'") {
                actual += "'"
                i++
                continue
            }
            comilla = !comilla
            actual += c
            continue
        }
        if (c === "," && !comilla) {
            partes.push(actual.trim())
            actual = ""
            continue
        }
        actual += c
    }
    if (actual.trim()) partes.push(actual.trim())
    return partes
}

// Interpreta lo que hay dentro de [ ]: registros base/índice (BX, BP, SI, DI) y desplazamiento numérico.
function parsearMemoria(contenido: string, simbolos: MapaSimbolos): Operando {
    const partes = contenido.split("+").map(p => p.trim()).filter(Boolean)
    let base: string | undefined
    let index: string | undefined
    let disp = 0
    for (const p of partes) {
        if (RM[p] !== undefined && !/^[0-9A-F]+H$/.test(p)) {
            if (!base) base = p
            else if (!index) index = p
        } else {
            const numero = parsearNumero(p)
            if (numero !== null) disp += numero
            else disp += simbolos.get(p.toUpperCase()) ?? 0
        }
    }
    return { tipo: "mem", base, index, disp }
}

// Clasifica un operando: registro (8/16 bits), registro de segmento, número inmediato o memoria.
// Si es el nombre de una variable, la trata como memoria con su dirección y tamaño.
function parsearOperando(texto: string, simbolos: MapaSimbolos, tamanos?: MapaTamanos): Operando {
    const t = texto.trim().toUpperCase()
    if (REG8[t] !== undefined) return { tipo: "reg", nombre: t, bits: 8, codigo: REG8[t] }
    if (REG16[t] !== undefined) return { tipo: "reg", nombre: t, bits: 16, codigo: REG16[t] }
    if (SEG[t] !== undefined) return { tipo: "seg", nombre: t, codigo: SEG[t] }
    const numero = parsearNumero(t)
    if (numero !== null) return { tipo: "inm", valor: numero }
    if (t.startsWith("[") && t.endsWith("]")) return parsearMemoria(t.slice(1, -1), simbolos)
    return { tipo: "mem", disp: simbolos.get(t) ?? 0, simbolo: t, bits: tamanos?.get(t) }
}

// Genera el ModRM de un operando de memoria y sus bytes de desplazamiento:
// variable sola -> dirección directa (mod 00, r/m 110); sin desplazamiento -> mod 00;
// desplazamiento de 8 bits -> mod 01; de 16 bits -> mod 10.
function modrmMemoria(op: Extract<Operando, { tipo: "mem" }>, reg: number): number[] {
    if (!op.base && !op.index) {
        return [modrm(0, reg, 6), ...bytes16(op.disp)]
    }

    const clave = [op.base, op.index].filter(Boolean).join("+")
    const rm = RM[clave] ?? 6

    if (op.disp === 0 && rm !== 6) return [modrm(0, reg, rm)]
    if (cabeEn8(op.disp)) return [modrm(1, reg, rm), op.disp & 0xFF]
    return [modrm(2, reg, rm), ...bytes16(op.disp)]
}

// Genera el ModRM de cualquier operando: si es registro usa mod 11, si es memoria usa modrmMemoria.
function modrmOperando(op: Operando, reg: number): number[] {
    if (op.tipo === "reg") return [modrm(3, reg, op.codigo)]
    if (op.tipo === "mem") return modrmMemoria(op, reg)
    if (op.tipo === "seg") return [modrm(3, reg, op.codigo)]
    return [modrm(3, reg, 0)]
}

// Indica si la línea es una directiva o comentario (.DATA, PROC, END...), que no genera bytes.
function esDirectiva(instruccion: string): boolean {
    return DIRECTIVAS.has(instruccion) || instruccion.startsWith(";") || instruccion === ""
}

// Convierte una declaración DB/DW en bytes del segmento de datos: números, cadenas (código ASCII)
// y "?" (byte sin inicializar, marcado con -1).
function bytesDeDatos(instruccion: string, operandos: string): number[] {
    const valores = dividedor(operandos)
    const resultado: number[] = []

    for (const valor of valores) {
        if (valor === "?") {
            resultado.push(-1)
            if (instruccion === "DW") resultado.push(-1)
            continue
        }
        if (valor.startsWith("'") && valor.endsWith("'")) {
            const texto = valor.slice(1, -1).replace(/''/g, "'")
            for (const letra of texto) resultado.push(letra.charCodeAt(0))
            continue
        }
        const numero = parsearNumero(valor.toUpperCase())
        if (numero === null) continue
        if (instruccion === "DW") resultado.push(...bytes16(numero))
        else resultado.push(numero & 0xFF)
    }
    return resultado
}

export class GeneradorCodigoObjeto {
    private filas: FilaASM[]
    private modosSalto: Map<number, "short" | "near"> = new Map()
    private saltosFueraDeRango: Set<number> = new Set()
    // Tamaño de cada variable según su directiva: DB = 8 bits, DW = 16 bits.
    private tamanos: MapaTamanos = new Map()

    // Recibe las filas del ensamblador y registra el tamaño de cada variable declarada.
    constructor(filas: FilaASM[]) {
        this.filas = filas
        filas.forEach(f => {
            const instr = f.instruccion.toUpperCase()
            if (f.etiqueta && (instr === "DB" || instr === "DW")) {
                this.tamanos.set(f.etiqueta.toUpperCase(), instr === "DB" ? 8 : 16)
            }
        })
    }

    // Punto de entrada: ejecuta las dos pasadas y devuelve la tabla de código objeto.
    // Si algún salto corto no alcanza su destino, lo cambia a salto largo (near) y repite.
    public generar(): FilaCO[] {
        for (let intento = 0; intento < 4; intento++) {
            this.saltosFueraDeRango.clear()
            const { simbolos, etiquetas } = this.pasar1()
            const { filasCO } = this.pasar2(simbolos, etiquetas)
            if (this.saltosFueraDeRango.size === 0) return filasCO
            this.saltosFueraDeRango.forEach(i => this.modosSalto.set(i, "near"))
        }
        const { simbolos, etiquetas } = this.pasar1()
        return this.pasar2(simbolos, etiquetas).filasCO
    }

    // Primera pasada: calcula las direcciones de variables y etiquetas.
    private pasar1(): { simbolos: MapaSimbolos; etiquetas: MapaSimbolos } {
        const simbolos: MapaSimbolos = new Map()
        const etiquetas: MapaSimbolos = new Map()
        let datos = 0
        let codigo = 0

        this.filas.forEach(f => {
            const instr = f.instruccion.toUpperCase()
            if (instr === ".DATA" || instr === ".CODE") return
            if (f.etiqueta.endsWith(":")) {
                etiquetas.set(f.etiqueta.slice(0, -1).toUpperCase(), codigo)
                return
            }
            if (esDirectiva(instr)) {
                if (instr === "PROC" && f.etiqueta) etiquetas.set(f.etiqueta.toUpperCase(), codigo)
                return
            }
            if (instr === "DW" || instr === "DB") {
                if (f.etiqueta) simbolos.set(f.etiqueta.toUpperCase(), datos)
                datos += bytesDeDatos(instr, f.operandos).length
                return
            }
            codigo += this.codificar(f, simbolos, etiquetas, codigo, 0).length
        })

        return { simbolos, etiquetas }
    }

    // Segunda pasada: emite los bytes con las direcciones ya resueltas.
    private pasar2(simbolos: MapaSimbolos, etiquetas: MapaSimbolos): { filasCO: FilaCO[] } {
        const filasCO: FilaCO[] = []
        let datos = 0
        let codigo = 0
        let segmento: Segmento = "CODIGO"
        this.origenBytes = [] // IDs: se reinicia en cada segunda pasada

        this.filas.forEach((f, indice) => {
            const instr = f.instruccion.toUpperCase()
            if (instr === ".DATA") { segmento = "DATOS"; return }
            if (instr === ".CODE") { segmento = "CODIGO"; return }
            if (esDirectiva(instr) || f.etiqueta.endsWith(":")) return

            const direccion = segmento === "DATOS" ? datos : codigo
            const bytes = this.codificar(f, simbolos, etiquetas, direccion, indice)

            bytes.forEach((byte, desplazamiento) => {
                this.origenBytes.push(indice) // IDs: fila del ensamblador que generó este byte
                filasCO.push({
                    segmento,
                    direccion: formatearDireccion(direccion + desplazamiento),
                    contenido: byte < 0 ? "????????" : formatearByte(byte),
                    hex: byte < 0 ? "--" : byte.toString(16).toUpperCase().padStart(2, "0")
                })
            })

            if (segmento === "DATOS") datos += bytes.length
            else codigo += bytes.length
        })

        return { filasCO }
    }

    // Traduce una fila de ensamblador a sus bytes de código máquina según el tipo de instrucción.
    private codificar(
        f: FilaASM,
        simbolos: MapaSimbolos,
        etiquetas: MapaSimbolos,
        direccion: number,
        indice: number
    ): number[] {
        const instr = f.instruccion.toUpperCase()
        const partes = dividedor(f.operandos)
        const a = partes[0] ? parsearOperando(partes[0], simbolos, this.tamanos) : undefined
        const b = partes[1] ? parsearOperando(partes[1], simbolos, this.tamanos) : undefined

        if (instr === "DW" || instr === "DB") return bytesDeDatos(instr, f.operandos)

        if (SIN_OPERANDOS[instr] !== undefined) return [SIN_OPERANDOS[instr]]

        if (instr === "MOV") return this.codificarMov(a, b)
        if (instr === "MOVZX") {
            if (!a || !b) return []
            return [0x0F, 0xB6, ...modrmOperando(b, a.tipo === "reg" ? a.codigo : 0)]
        }
        if (instr === "LEA") {
            if (!a || !b) return []
            return [0x8D, ...modrmOperando(b, a.tipo === "reg" ? a.codigo : 0)]
        }
        if (ALU[instr]) return this.codificarAlu(instr, a, b)
        if (instr === "MUL" || instr === "DIV") {
            if (!a) return []
            return [(es8Bits(a) ? 0xF6 : 0xF7), ...modrmOperando(a, instr === "MUL" ? 4 : 6)]
        }
        if (instr === "INC" || instr === "DEC") {
            if (!a) return []
            const ext = instr === "INC" ? 0 : 1
            if (a.tipo === "reg" && a.bits === 16) return [(instr === "INC" ? 0x40 : 0x48) + a.codigo]
            return [es8Bits(a) ? 0xFE : 0xFF, ...modrmOperando(a, ext)]
        }
        if (instr === "PUSH" || instr === "POP") {
            if (!a || a.tipo !== "reg") return []
            return [(instr === "PUSH" ? 0x50 : 0x58) + a.codigo]
        }
        if (instr === "JMP") return this.codificarSalto("JMP", partes[0], etiquetas, direccion, indice)
        if (SALTOS[instr] !== undefined) return this.codificarSalto(instr, partes[0], etiquetas, direccion, indice)
        if (instr === "LOOP") return this.codificarSalto("LOOP", partes[0], etiquetas, direccion, indice)
        if (instr === "CALL") return this.codificarLlamada(partes[0], etiquetas, direccion)
        if (instr === "INT") {
            if (!a || a.tipo !== "inm") return []
            return [0xCD, a.valor & 0xFF]
        }

        return []
    }

    // Codifica MOV en todas sus formas: inmediato a registro (B0/B8), registro a registro (88/89),
    // memoria a registro (8A/8B), con segmentos (8C/8E) e inmediato a memoria (C6/C7).
    private codificarMov(a: Operando | undefined, b: Operando | undefined): number[] {
        if (!a || !b) return []

        if (a.tipo === "reg") {
            if (b.tipo === "inm") {
                const opcode = (a.bits === 8 ? 0xB0 : 0xB8) + a.codigo
                return [opcode, ...bytesInmediato(b.valor, a.bits)]
            }
            if (b.tipo === "seg") return [0x8C, ...modrmOperando(a, b.codigo)]
            if (b.tipo === "reg") {
                const opcode = a.bits === 8 ? 0x88 : 0x89
                return [opcode, ...modrmOperando(a, b.codigo)]
            }
            const opcode = a.bits === 8 ? 0x8A : 0x8B
            return [opcode, ...modrmOperando(b, a.codigo)]
        }

        if (a.tipo === "seg") {
            return [0x8E, ...modrmOperando(b, a.codigo)]
        }

        if (b.tipo === "inm") {
            // El tamaño lo decide la variable destino (DB -> C6 + 1 byte, DW -> C7 + 2 bytes),
            // no el valor del número.
            const ocho = es8Bits(a)
            return [ocho ? 0xC6 : 0xC7, ...modrmOperando(a, 0), ...bytesInmediato(b.valor, ocho ? 8 : 16)]
        }
        if (b.tipo === "seg") return [0x8C, ...modrmOperando(a, b.codigo)]

        const bits = b.tipo === "reg" ? b.bits : 16
        return [bits === 8 ? 0x88 : 0x89, ...modrmOperando(a, b.tipo === "reg" ? b.codigo : 0)]
    }

    // Codifica las operaciones aritméticas y lógicas (ADD, SUB, AND, OR, XOR, CMP, ADC, SBB):
    // con número usa la forma corta del acumulador o el grupo 80/81/83; con registros o memoria usa base + d + w.
    private codificarAlu(instr: string, a: Operando | undefined, b: Operando | undefined): number[] {
        if (!a || !b) return []
        const { base, ext } = ALU[instr]

        if (b.tipo === "inm") {
            const esAcumulador = a.tipo === "reg" && a.codigo === 0
            if (esAcumulador && (a.bits === 16 || (a.bits === 8 && cabeEn8(b.valor)))) {
                return [base + (a.bits === 8 ? 4 : 5), ...bytesInmediato(b.valor, a.bits)]
            }
            if (es8Bits(a)) {
                return [0x80, ...modrmOperando(a, ext), b.valor & 0xFF]
            }
            if (cabeEn8(b.valor)) return [0x83, ...modrmOperando(a, ext), b.valor & 0xFF]
            return [0x81, ...modrmOperando(a, ext), ...bytes16(b.valor)]
        }

        if (a.tipo === "reg" || a.tipo === "seg") {
            const opcode = base + (a.tipo === "reg" && a.bits === 8 ? 2 : 3)
            return [opcode, ...modrmOperando(b, a.tipo === "reg" ? a.codigo : a.codigo)]
        }

        const bits = b.tipo === "reg" ? b.bits : 16
        return [base + (bits === 8 ? 0 : 1), ...modrmOperando(a, b.tipo === "reg" ? b.codigo : 0)]
    }

    // Codifica JMP, saltos condicionales (JE, JLE...) y LOOP con desplazamiento relativo:
    // destino - dirección de la instrucción siguiente. Marca los saltos cortos que no alcanzan.
    private codificarSalto(
        instr: string,
        etiqueta: string | undefined,
        etiquetas: MapaSimbolos,
        direccion: number,
        indice: number
    ): number[] {
        if (!etiqueta) return []
        const destino = etiquetas.get(etiqueta.trim().toUpperCase()) ?? 0
        const modo = this.modosSalto.get(indice) ?? "short"

        if (instr === "LOOP") {
            return [0xE2, (destino - (direccion + 2)) & 0xFF]
        }

        if (instr === "JMP") {
            if (modo === "near") return [0xE9, ...bytes16(destino - (direccion + 3))]
            const rel = destino - (direccion + 2)
            if (!cabeEn8(rel)) {
                this.saltosFueraDeRango.add(indice)
                return [0xEB, rel & 0xFF]
            }
            return [0xEB, rel & 0xFF]
        }

        const codigoSalto = SALTOS[instr]
        if (modo === "near") return [0x0F, 0x80 + codigoSalto, ...bytes16(destino - (direccion + 4))]
        const rel = destino - (direccion + 2)
        if (!cabeEn8(rel)) {
            this.saltosFueraDeRango.add(indice)
            return [0x70 + codigoSalto, rel & 0xFF]
        }
        return [0x70 + codigoSalto, rel & 0xFF]
    }

    // Codifica CALL (E8) con un desplazamiento relativo de 16 bits hacia el procedimiento.
    private codificarLlamada(etiqueta: string | undefined, etiquetas: MapaSimbolos, direccion: number): number[] {
        if (!etiqueta) return []
        const destino = etiquetas.get(etiqueta.trim().toUpperCase()) ?? 0
        return [0xE8, ...bytes16(destino - (direccion + 3))]
    }

    // ===================================================================
    // IDs para relacionar el Código intermedio con el Código objeto
    // ===================================================================

    // Para cada byte generado, el índice de la fila del ensamblador de la que salió.
    private origenBytes: number[] = []

    // Igual que generar(), pero devuelve el ensamblador y el código objeto con IDs
    // para poder relacionar cada instrucción con sus bytes.
    public generarConIds(): { asm: FilaASMConId[]; co: FilaCOConId[] } {
        const co = this.generar()
        return asignarIds(this.filas, co, this.origenBytes)
    }
}

// Muestra una dirección como 16 bits en grupos de 4 (ej. 0000 0000 0001 0101).
function formatearDireccion(valor: number): string {
    return valor.toString(2).padStart(16, "0").match(/.{4}/g)?.join(" ") ?? "0000 0000 0000 0000"
}

// Muestra un byte como 8 bits en grupos de 4 (ej. 1000 1011).
function formatearByte(byte: number): string {
    return byte.toString(2).padStart(8, "0").match(/.{4}/g)?.join(" ") ?? "0000 0000"
}

// ===================================================================
// IDs para relacionar el Código intermedio con el Código objeto
// ===================================================================

// Asigna IDs consecutivos (1, 2, 3...) solo a las filas del ensamblador que generaron bytes,
// en el mismo orden en que aparecen. Cada byte del código objeto recibe el ID de su fila de origen.
function asignarIds(
    asm: FilaASM[],
    co: FilaCO[],
    origenBytes: number[]
): { asm: FilaASMConId[]; co: FilaCOConId[] } {
    const idPorFila = new Map<number, number>()
    let siguiente = 1
    origenBytes.forEach(indice => {
        if (!idPorFila.has(indice)) idPorFila.set(indice, siguiente++)
    })

    return {
        asm: asm.map((fila, indice) => ({ ...fila, id: idPorFila.get(indice) ?? null })),
        co: co.map((fila, k) => ({ ...fila, id: idPorFila.get(origenBytes[k]) ?? 0 }))
    }
}
