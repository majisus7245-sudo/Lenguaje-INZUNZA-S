import type { PROGRAMA, DECLARACION, DECLARAR_VARIABLE, ASIGNACION, IF, WHILE, READ, PRINT, EXPRESION, TERMINO, DOBLE_EXPRESION, VARIABLE } from "./ast"

class TablaSimbolos {
    private simbolos: Simbolo[]
    
    constructor() {
        this.simbolos = []
    }

    public agregarSimbolo(simbolo: Simbolo): void {
        this.simbolos.push(simbolo)
    }

    public buscarSimbolo(nombre: string): Simbolo | undefined {
        return this.simbolos.find(simbolo => simbolo.getNombre() === nombre)
    }
}

class Simbolo {
    private nombre: string
    private tipo: 'int' | 'bool'
    private inicializada: boolean // Indica si la variable ha sido inicializada para no usarla antes de asignarle un valor

    constructor(nombre: string, tipo: 'int' | 'bool', inicializada: boolean) {
        this.nombre = nombre
        this.tipo = tipo
        this.inicializada = inicializada
    }

    public getNombre(): string {
        return this.nombre
    }
    
    public getTipo(): 'int' | 'bool' {
        return this.tipo
    }
    
    public getInicializada(): boolean {
        return this.inicializada
    }

    public setInicializada(valor: boolean): void {
        this.inicializada = valor
    }
}

export class Semantica {
    private tablaSimbolos: TablaSimbolos
    private programa: PROGRAMA
    private errores: string[]

    constructor(programa: PROGRAMA) {
        this.tablaSimbolos = new TablaSimbolos()
        this.programa = programa
        this.errores = []
    }

    public analizar(): string[] {
        this.procesarBloque(this.programa.body)
        return this.errores
    }

    private procesarBloque(declaraciones: DECLARACION[]) {
        declaraciones.forEach(dec => this.procesarDeclaracion(dec))
    }

    private procesarDeclaracion(dec: DECLARACION) {
        switch (dec.type) {
            case "DECLARAR_VARIABLE":
                const decVar = dec as DECLARAR_VARIABLE
                const nombreVar = decVar.variable.variable
                if (this.tablaSimbolos.buscarSimbolo(nombreVar)) {
                    this.errores.push(`Error Semántico: La variable '${nombreVar}' ya fue declarada.`)
                } else {
                    this.tablaSimbolos.agregarSimbolo(new Simbolo(nombreVar, decVar.dataType, false))
                }
                break

            case "ASIGNACION":
                const asig = dec as ASIGNACION
                const nomVarAsig = asig.variable.variable
                const sim = this.tablaSimbolos.buscarSimbolo(nomVarAsig)
                
                if (!sim) {
                    this.errores.push(`Error Semántico: La variable '${nomVarAsig}' no está declarada.`)
                } else {
                    const tipoExpresion = this.evaluarTipoExpresion(asig.valor)
                    if (tipoExpresion !== 'error' && tipoExpresion !== sim.getTipo()) {
                        this.errores.push(`Error Semántico: Incompatibilidad de tipos. No se puede asignar un '${tipoExpresion}' a la variable '${nomVarAsig}' de tipo '${sim.getTipo()}'.`)
                    }
                    sim.setInicializada(true)
                }
                break

            case "READ":
                const readStmt = dec as READ
                const nomVarRead = readStmt.variable.variable
                const simRead = this.tablaSimbolos.buscarSimbolo(nomVarRead)
                
                if (!simRead) {
                    this.errores.push(`Error Semántico: La variable '${nomVarRead}' no está declarada.`)
                } else {
                    simRead.setInicializada(true)
                }
                break

            case "PRINT":
                const printStmt = dec as PRINT
                if (printStmt.argument.type !== "CADENA") {
                    this.evaluarTipoExpresion(printStmt.argument as TERMINO)
                }
                break

            case "IF":
                const ifStmt = dec as IF
                const tipoCondIf = this.evaluarTipoExpresion(ifStmt.condition)
                if (tipoCondIf !== 'error' && tipoCondIf !== 'bool') {
                    this.errores.push(`Error Semántico: La condición del 'if' debe ser de tipo 'bool', se recibió '${tipoCondIf}'.`)
                }
                this.procesarBloque(ifStmt.then)
                if (ifStmt.else) {
                    this.procesarBloque(ifStmt.else)
                }
                break

            case "WHILE":
                const whileStmt = dec as WHILE
                const tipoCondWhile = this.evaluarTipoExpresion(whileStmt.condition)
                if (tipoCondWhile !== 'error' && tipoCondWhile !== 'bool') {
                    this.errores.push(`Error Semántico: La condición del 'while' debe ser de tipo 'bool', se recibió '${tipoCondWhile}'.`)
                }
                this.procesarBloque(whileStmt.body)
                break
        }
    }

    // Evalúa el tipo de una expresión y verifica errores internos
    private evaluarTipoExpresion(expr: EXPRESION): 'int' | 'bool' | 'error' {
        if (expr.type === "TERMINO") {
            const termino = expr as TERMINO
            
            if (termino.valor.type === "NUMERO") return 'int'
            if (termino.valor.type === "BOOLEANO") return 'bool'
            
            if (termino.valor.type === "VARIABLE") {
                const nomVar = (termino.valor as VARIABLE).variable
                const sim = this.tablaSimbolos.buscarSimbolo(nomVar)
                
                if (!sim) {
                    this.errores.push(`Error Semántico: Uso de variable no declarada '${nomVar}'.`)
                    return 'error'
                }
                if (!sim.getInicializada()) {
                    this.errores.push(`Error Semántico: La variable '${nomVar}' no ha sido inicializada.`)
                }
                return sim.getTipo()
            }
        } 
        else if (expr.type === "DOBLE_EXPRESION") {
            const dobleExpr = expr as DOBLE_EXPRESION
            const tipoIzq = this.evaluarTipoExpresion(dobleExpr.left)
            const tipoDer = this.evaluarTipoExpresion(dobleExpr.right)

            if (tipoIzq === 'error' || tipoDer === 'error') return 'error'

            const op = dobleExpr.operator

            // Operadores Aritméticos: esperan ser usados por dos int, devuelven int
            if (['@', '#', '&', '|'].includes(op)) {
                if (tipoIzq !== 'int' || tipoDer !== 'int') {
                    this.errores.push(`Error Semántico: El operador '${op}' requiere operandos de tipo 'int'.`)
                    return 'error'
                }
                return 'int'
            }
            // Operadores Relacionales: esperan ser usados por dos int, devuelven bool
            else if (['>', '<'].includes(op)) {
                if (tipoIzq !== 'int' || tipoDer !== 'int') {
                    this.errores.push(`Error Semántico: El operador '${op}' requiere operandos de tipo 'int'.`)
                    return 'error'
                }
                return 'bool'
            }
            // Operadores de Igualdad: esperan ser usados por dos int o dos bool, devuelven bool
            else if (['==', '!='].includes(op)) {
                if (tipoIzq !== tipoDer) {
                    this.errores.push(`Error Semántico: El operador '${op}' no puede comparar '${tipoIzq}' con '${tipoDer}'.`)
                    return 'error'
                }
                return 'bool'
            }
            // Operadores Lógicos: esperan ser usados por dos bool, devuelven bool
            else if (['&&', '||'].includes(op)) {
                if (tipoIzq !== 'bool' || tipoDer !== 'bool') {
                    this.errores.push(`Error Semántico: El operador '${op}' requiere operandos de tipo 'bool'.`)
                    return 'error'
                }
                return 'bool'
            }
        }

        return 'error'
    }
}