//Inzunza Lara Manuel de Jesus
//LyA 2 13 - 14
//Ensamblador
import type { FilaASM } from "../types"
import type { PROGRAMA, DECLARACION, ASIGNACION, IF, WHILE, READ, PRINT, CADENA, EXPRESION, TERMINO, DOBLE_EXPRESION } from "./ast"
import type { FilaCI } from "./codigoIntermedio"
const TITULO = "Prac01"

const ARITMETICOS: Record<string, string> = {
    "@": "ADD", "#": "SUB", "&": "MUL", "|": "DIV",
}

const LOGICOS: Record<string, string> = {
    "&&": "AND", "||": "OR",
}

const RELACIONALES: Record<string, { siVerdadero: string, siFalso: string }> = {
    ">":  { siVerdadero: "JG",  siFalso: "JLE" }, "<":  { siVerdadero: "JL",  siFalso: "JGE" },
    "==": { siVerdadero: "JE",  siFalso: "JNE" }, "!=": { siVerdadero: "JNE", siFalso: "JE"  },
}

export class GeneradorEnsamblador {
    private programa: PROGRAMA
    private tablaCI: FilaCI[]
    private filas: FilaASM[] = []
    private contadorEtiquetas = 0
    private mensajes: { nombre: string, texto: string }[] = []
    private usaImprimirNumero = false
    private usaLeerNumero = false

    constructor(programa: PROGRAMA, tablaCI: FilaCI[]) {
        this.programa = programa
        this.tablaCI = tablaCI
    }

    public generar(): FilaASM[] {
        this.filas = []
        this.contadorEtiquetas = 0
        this.mensajes = []
        this.usaImprimirNumero = false
        this.usaLeerNumero = false

        this.bloque(this.programa.body)
        const cuerpo = this.filas
        this.filas = []

        this.encabezado()
        this.segmentoDatos()
        this.segmentoCodigo(cuerpo)

        return this.filas
    }

    private encabezado() {
        this.emitir("TITLE", TITULO)
        this.emitir(".MODEL", "Small")
        this.emitir(".486")
        this.emitir(".STACK")
    }

    private segmentoDatos() {
        this.emitir(".DATA")
        this.tablaCI.forEach(fila => this.emitir(fila.directiva, fila.valor, fila.nombre))
        this.mensajes.forEach(m => this.emitir("DB", `'${m.texto}', 0DH, 0AH, '$'`, m.nombre))
    }

    private segmentoCodigo(cuerpo: FilaASM[]) {
        this.emitir(".CODE")
        this.emitir("PROC", "FAR", "MAIN")
        this.emitir(".STARTUP")

        this.filas.push(...cuerpo)

        this.emitir(".EXIT")
        this.emitir("ENDP", "", "MAIN")

        if (this.usaImprimirNumero) this.rutinaImprimirNumero()
        if (this.usaLeerNumero) this.rutinaLeerNumero()

        this.emitir("END")
    }

    private emitir(instruccion: string, operandos = "", etiqueta = "") {
        this.filas.push({ etiqueta, instruccion, operandos })
    }

    private emitirEtiqueta(nombre: string) {
        this.filas.push({ etiqueta: nombre + ":", instruccion: "", operandos: "" })
    }

    private comentario(texto: string) {
        this.filas.push({ etiqueta: "", instruccion: "; " + texto, operandos: "" })
    }

    private nuevaEtiqueta(prefijo: string): string {
        return `${prefijo}_${++this.contadorEtiquetas}`
    }

    private esByte(nombre: string): boolean {
        return this.tablaCI.find(f => f.nombre === nombre)?.directiva === "DB"
    }

    private bloque(declaraciones: DECLARACION[]) {
        declaraciones.forEach(d => this.sentencia(d))
    }

    private sentencia(dec: DECLARACION) {
        switch (dec.type) {
            case "DECLARAR_VARIABLE":
                break 

            case "ASIGNACION":
                this.generarAsignacion(dec as ASIGNACION)
                break

            case "IF":
                this.generarIf(dec as IF)
                break

            case "WHILE":
                this.generarWhile(dec as WHILE)
                break

            case "READ":
                this.generarRead(dec as READ)
                break

            case "PRINT":
                this.generarPrint(dec as PRINT)
                break
        }
    }

    private generarAsignacion(a: ASIGNACION) {
        const destino = a.variable.variable
        const valor = a.valor

        if (valor.type === "TERMINO" && this.esLiteral(valor as TERMINO)) {
            this.emitir("MOV", `${destino}, ${this.literal(valor as TERMINO)}`)
            return
        }

        this.evaluarEnAX(valor)
        this.emitir("MOV", `${destino}, ${this.esByte(destino) ? "AL" : "AX"}`)
    }

    private generarIf(i: IF) {
        const etiquetaElse = this.nuevaEtiqueta("ELSE")
        const etiquetaFin = this.nuevaEtiqueta("FIN_IF")

        this.saltarSiFalso(i.condition, etiquetaElse)
        this.bloque(i.then)
        this.emitir("JMP", etiquetaFin)

        this.emitirEtiqueta(etiquetaElse)
        if (i.else) this.bloque(i.else)
        this.emitirEtiqueta(etiquetaFin)
    }

    private generarWhile(w: WHILE) {
        const etiquetaInicio = this.nuevaEtiqueta("INICIO_WHILE")
        const etiquetaFin = this.nuevaEtiqueta("FIN_WHILE")

        this.emitirEtiqueta(etiquetaInicio)
        this.saltarSiFalso(w.condition, etiquetaFin)
        this.bloque(w.body)
        this.emitir("JMP", etiquetaInicio)
        this.emitirEtiqueta(etiquetaFin)
    }

    private generarRead(r: READ) {
        const destino = r.variable.variable
        this.emitir("CALL", "LEER_NUM")
        this.emitir("MOV", `${destino}, ${this.esByte(destino) ? "AL" : "AX"}`)
        this.usaLeerNumero = true
    }

    private generarPrint(p: PRINT) {
        if (p.argument.type === "CADENA") {
            const nombre = this.registrarMensaje((p.argument as CADENA).value)
            this.emitir("MOV", "BX, 0001H")
            this.emitir("LEA", `DX, ${nombre}`)
            this.emitir("MOV", "AH, 09H")
            this.emitir("INT", "21H")
            return
        }

        this.cargar("AX", p.argument as TERMINO)
        this.emitir("CALL", "IMPRIMIR_NUM")
        this.usaImprimirNumero = true
    }

    private registrarMensaje(textoToken: string): string {
        const texto = textoToken.replace(/^'|'$/g, "").replace(/'/g, "''")
        const existente = this.mensajes.find(m => m.texto === texto)
        if (existente) return existente.nombre

        const nombre = `MSG${this.mensajes.length + 1}`
        this.mensajes.push({ nombre, texto })
        return nombre
    }

    private rutinaImprimirNumero() {
        this.emitir("PROC", "NEAR", "IMPRIMIR_NUM")
        this.emitir("PUSH", "AX")
        this.emitir("PUSH", "BX")
        this.emitir("PUSH", "CX")
        this.emitir("PUSH", "DX")

        this.emitir("MOV", "CX, 0")
        this.emitir("MOV", "BX, 10")
        this.emitirEtiqueta("IN_DIVIDIR")
        this.emitir("MOV", "DX, 0")
        this.emitir("DIV", "BX")
        this.emitir("PUSH", "DX")
        this.emitir("INC", "CX")
        this.emitir("CMP", "AX, 0")
        this.emitir("JNE", "IN_DIVIDIR")

        this.emitirEtiqueta("IN_MOSTRAR")
        this.emitir("POP", "DX")
        this.emitir("ADD", "DL, 30H")
        this.emitir("MOV", "AH, 02H")
        this.emitir("INT", "21H")
        this.emitir("LOOP", "IN_MOSTRAR")

        this.emitir("MOV", "DL, 0DH")
        this.emitir("MOV", "AH, 02H")
        this.emitir("INT", "21H")
        this.emitir("MOV", "DL, 0AH")
        this.emitir("MOV", "AH, 02H")
        this.emitir("INT", "21H")

        this.emitir("POP", "DX")
        this.emitir("POP", "CX")
        this.emitir("POP", "BX")
        this.emitir("POP", "AX")
        this.emitir("RET")
        this.emitir("ENDP", "", "IMPRIMIR_NUM")
    }

    private rutinaLeerNumero() {
        this.emitir("PROC", "NEAR", "LEER_NUM")
        this.emitir("PUSH", "BX")
        this.emitir("PUSH", "CX")
        this.emitir("PUSH", "DX")

        this.emitir("MOV", "BX, 0")
        this.emitir("MOV", "CX, 0")

        this.emitirEtiqueta("LN_LEER_CHAR")
        this.emitir("MOV", "AH, 01H")
        this.emitir("INT", "21H")

        this.emitir("CMP", "AL, 0DH")
        this.emitir("JE", "LN_FIN")

        this.emitir("SUB", "AL, 30H")
        this.emitir("MOV", "AH, 0")
        this.emitir("PUSH", "AX")

        this.emitir("MOV", "AX, BX")
        this.emitir("MOV", "DX, 10")
        this.emitir("MUL", "DX")
        this.emitir("MOV", "BX, AX")

        this.emitir("POP", "AX")
        this.emitir("ADD", "BX, AX")
        this.emitir("JMP", "LN_LEER_CHAR")

        this.emitirEtiqueta("LN_FIN")
        this.emitir("MOV", "AX, BX")

        this.emitir("POP", "DX")
        this.emitir("POP", "CX")
        this.emitir("POP", "BX")
        this.emitir("RET")
        this.emitir("ENDP", "", "LEER_NUM")
    }

    private saltarSiFalso(cond: EXPRESION, etiqueta: string) {
        if (cond.type === "DOBLE_EXPRESION") {
            const d = cond as DOBLE_EXPRESION
            const rel = RELACIONALES[d.operator]
            if (rel) {
                this.comparar(d)
                this.emitir(rel.siFalso, etiqueta)
                return
            }
        }

        this.evaluarEnAX(cond)
        this.emitir("CMP", "AX, 0")
        this.emitir("JE", etiqueta)
    }

    private comparar(d: DOBLE_EXPRESION) {
        const derecho = this.prepararDerecho(d, true)
        this.emitir("CMP", `AX, ${derecho}`)
    }

    private evaluarEnAX(e: EXPRESION) {
        if (e.type === "TERMINO") {
            this.cargar("AX", e as TERMINO)
            return
        }

        const d = e as DOBLE_EXPRESION
        const op = d.operator

        if (ARITMETICOS[op] || LOGICOS[op]) {
            const instr = ARITMETICOS[op] ?? LOGICOS[op]
            const inmediatoOk = instr !== "MUL" && instr !== "DIV"
            const derecho = this.prepararDerecho(d, inmediatoOk)

            if (instr === "DIV") this.emitir("MOV", "DX, 0")

            if (instr === "MUL" || instr === "DIV") this.emitir(instr, derecho)
            else this.emitir(instr, `AX, ${derecho}`)
            return
        }

        const rel = RELACIONALES[op]
        if (rel) {
            const etiqueta = this.nuevaEtiqueta("CMP")
            this.comparar(d)
            this.emitir("MOV", "AX, 1")
            this.emitir(rel.siVerdadero, etiqueta)
            this.emitir("MOV", "AX, 0")
            this.emitirEtiqueta(etiqueta)
            return
        }

        this.comentario(`operador ${op} no soportado`)
    }

    // EXPRESION -> TERMINO OPERADOR TERMINO: ambos lados siempre son términos.
    // Carga el término izquierdo en AX y devuelve cómo usar el derecho (número, variable o BX).
    private prepararDerecho(d: DOBLE_EXPRESION, inmediatoOk: boolean): string {
        this.cargar("AX", d.left)
        const der = d.right

        if (this.esLiteral(der)) {
            if (inmediatoOk) return this.literal(der)
            this.emitir("MOV", `BX, ${this.literal(der)}`)
            return "BX"
        }

        const nombre = this.nombreVariable(der)
        if (this.esByte(nombre)) {
            this.emitir("MOVZX", `BX, ${nombre}`)
            return "BX"
        }
        return nombre
    }

    private cargar(reg: string, t: TERMINO) {
        if (this.esLiteral(t)) {
            this.emitir("MOV", `${reg}, ${this.literal(t)}`)
            return
        }
        const nombre = this.nombreVariable(t)
        this.emitir(this.esByte(nombre) ? "MOVZX" : "MOV", `${reg}, ${nombre}`)
    }

    private esLiteral(t: TERMINO): boolean {
        return t.valor.type !== "VARIABLE"
    }

    private nombreVariable(t: TERMINO): string {
        return (t.valor as { variable: string }).variable
    }

    private literal(t: TERMINO): string {
        const v = t.valor
        if (v.type === "BOOLEANO") return (v as { value: string }).value === "true" ? "1" : "0"
        return (v as { value: string }).value
    }
}