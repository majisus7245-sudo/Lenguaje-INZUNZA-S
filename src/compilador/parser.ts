import type { Token } from "../types"
import { DECLARAR_VARIABLE, IF, PROGRAMA, VARIABLE, type DECLARACION, DOBLE_EXPRESION, NUMERO, TERMINO, ASIGNACION } from './ast';

export class Parser {
    private tokens : Token[]
    private posicion : number
    private programa : PROGRAMA
    private error : boolean
    private token : Token | null = null
    private msg : string
    constructor(tokens : Token[]) {
        this.tokens = tokens
        this.posicion = 0
        this.error = false
        this.msg = ''
        this.programa = new PROGRAMA([])
    }

    public iniciarParsing() : boolean {

        this.programa = this.PROGRAMA()

        return !this.error
    }

    private PROGRAMA() : PROGRAMA {
        this.advance()

        this.eat({
            valor: '<!',
            type: 'INICIO_CODIGO'
        })

        const declaraciones : DECLARACION[] = []
        let declaracion
        while(this.token && this.token.type !== 'FIN_CODIGO' && !this.error){ 
            declaracion = this.declaraciones()
            if(declaracion)
                declaraciones.push(declaracion)
        }
        
        const programa = new PROGRAMA(declaraciones)

        this.eat({
            valor: '¡>',
            type: 'FIN_CODIGO'
        })

        return programa
    }

    private declaraciones() : DECLARACION | null {
        if (this.error || !this.token) return null

        if(this.token.valor === 'int' || this.token.valor === 'bool'){
            const dataType = this.token.valor
            return this.declararVariable(dataType)
        }

        if(this.token.type === 'VARIABLE'){
            return this.asignacion()
        }

        if(this.token.type === 'RESERVADA'){
            switch (this.token.valor) {
                case 'if':
                    return this.IF()
                default:
                    return null
                    break
            }
        }
        this.error = true
        this.msg = `Error de Sintaxis: Instrucción no reconocida '${this.token!.valor}' cerca de la posición ${this.posicion}`
        return null
    }

    private declararVariable(dataType : 'int' | 'bool') : DECLARAR_VARIABLE | null{
        this.eat({valor: dataType, type: 'RESERVADA'})

        if(!this.canContinue())
            return null

        const variable = new VARIABLE(this.token!.valor)
        this.eat({valor: '', type: 'VARIABLE'})
        this.eat({valor: ';', type: 'PUNTO'})
        return new DECLARAR_VARIABLE(dataType, variable)
    }

    private asignacion() : ASIGNACION | null {
        if(!this.canContinue())
            return null

        const variable = new VARIABLE(this.token!.valor)
        this.eat({valor: '', type: 'VARIABLE'})
        this.eat({valor: '=', type: 'OPERADOR_ASIGNACION'})
        const expresion = this.EXPRESION()
        this.eat({valor: ';', type: 'PUNTO'})

        if(!expresion)
            return null

        return new ASIGNACION(variable, expresion)
    }

    private IF() : IF | null  {

        if(!this.canContinue())
            return null
        
        this.eat({valor: 'if', type: 'RESERVADA'})
        this.eat({valor: '(', type: 'PUNTO'})
        const condition = this.EXPRESION()
        
        if(!condition)
            return null
        
        this.eat({valor: ')', type: 'PUNTO'})
        this.eat({valor: '{', type: 'PUNTO'})
        const thenBranch = this.if_else_Branch()
        
        if(!thenBranch)
            return null

        this.eat({valor: '}', type: 'PUNTO'})
        this.eat({valor: 'else', type: 'RESERVADA'})
        this.eat({valor: '{', type: 'PUNTO'})
        const elseBranch = this.if_else_Branch()
        this.eat({valor: '}', type: 'PUNTO'})

        return new IF(condition, thenBranch, elseBranch)
    }

    private if_else_Branch() : DECLARACION[] | null{
        if(!this.canContinue())
            return null
        const declaraciones : DECLARACION[] = []
        while(this.posicion < this.tokens.length && this.token!.valor !== '}'){
            const declaracion = this.declaraciones()
            if(declaracion)
                declaraciones.push(declaracion)
        }
        return declaraciones
    }

    private EXPRESION() : DOBLE_EXPRESION | TERMINO | null {
        if(!this.canContinue())
            return null

        if(this.posicion < this.tokens.length && (
            this.tokens[this.posicion].type === 'OPERADOR_RELACIONAL' || 
            this.tokens[this.posicion].type === 'OPERADOR_ARITMETICO'
        )){
            return this.DOBLE_EXPRESION()
        }

        return this.TERMINO()
    }

    private DOBLE_EXPRESION() : DOBLE_EXPRESION | null{
        if(!this.canContinue())
            return null

        const left = this.TERMINO()
        
        if(!left)
            return null

        const operator = this.token!.valor
        const type = this.token!.type
        this.eat({valor: '', type: type})
        const right = this.TERMINO()

        if(!right)
            return null

        return new DOBLE_EXPRESION(left, operator, right);
    }

    private TERMINO() : TERMINO | null {
        if(!this.canContinue())
            return null

        const valorToken = this.token!.valor
        let valor : NUMERO | VARIABLE

        if(Number.isFinite(+valorToken)){
            valor = new NUMERO(this.token!.valor)
            this.eat({valor: '', type: 'NUMERO'})
        }else {
            valor = new VARIABLE(this.token!.valor)
            this.eat({valor: '', type: 'VARIABLE'})
        }

        return new TERMINO(valor)
    }

    private canContinue() {
        return !this.error && this.token
    }

    private eat(tokenEsperado: Token) {
        if(this.error) 
            return

        if(this.token?.type === 'ERROR'){
            this.msg = `Error Léxico: ${this.token.valor} en la posicion ${this.posicion}`
            this.error = true
            return
        }

        if (this.token?.type === tokenEsperado.type) {
            
            if (tokenEsperado.valor && tokenEsperado.valor !== this.token.valor) {
                
                this.msg = `Syntax Error: se esperaba '${tokenEsperado.valor}' pero se encontró '${this.token.valor}' en la posicion ${this.posicion}`
                this.error = true
                return
            }
            this.advance()
            return
        }
        console.log(this.token, tokenEsperado);
        this.msg = `Syntax Error: Se esperaba un token de tipo ${tokenEsperado.type} en la posicion ${this.posicion}`
        this.error = true
    }

    private advance(){
        if(this.posicion < this.tokens.length){
            this.token = this.tokens[this.posicion]
            this.incrementarPosicion()
        }else
            this.token = null
    }

    private incrementarPosicion() {
        this.posicion++
    }

    public getPrograma(){
        return this.programa
    }
    public getMsg(){
        return this.msg
    }

}