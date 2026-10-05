import type { Estado, T, Token, TypeToken } from "../types";
import { Operadores_Aritmeticos, Puntos, T_Cadena, T_Fin_Codigo, T_Inicio_Codigo, T_Numero, T_Operadores_Relacionales, T_Palabra_Reservada, T_Variable } from "./transicionesTokens";

export class AnalizadorLexico {

    private codigo : string 
    private posicion : number
    constructor(codigo : string){
        this.codigo = codigo
        this.posicion = 0
    }
    private getInput(char : string) : string {
        if (char === ' ' || char === '\n' || char === '\t' || char === '\r')
            return 'espacio'
        if ("<!¡>=_&|'".includes(char)) 
            return char
        if ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".includes(char)) 
            return 'letra'
        if ("0123456789".includes(char)) 
            return 'digito'
        return 'otro'
    }
    private Accept(state : number) : boolean {
        return state === 99
    }
    private error(state : number) : boolean{
        return state === -1
    }
    private getEstado(transicion : T, estado : number): Estado {
        return transicion.find(t => t.estado === estado)!
    }
    private getTransicion(input: string) :  {transicion : T, type: TypeToken} | null{

        if(input === '<' && this.codigo[this.posicion+1] === '!')
            return {transicion: T_Inicio_Codigo, type: 'INICIO_CODIGO'}

        if(this.getEstado(T_Fin_Codigo, 1).inputs[input])
            return {transicion: T_Fin_Codigo, type: 'FIN_CODIGO'}

        if(this.getEstado(T_Palabra_Reservada, 1).inputs[input])
            return {transicion: T_Palabra_Reservada, type: 'RESERVADA'} 

        if(this.getEstado(T_Variable, 1).inputs[input])
            return {transicion: T_Variable, type: 'VARIABLE'} 

        if(this.getEstado(T_Numero, 1).inputs[input])
            return {transicion: T_Numero, type: 'NUMERO'} 

        if(this.getEstado(T_Cadena, 1).inputs[input])
            return {transicion: T_Cadena, type: 'CADENA'} 

        if(this.getEstado(T_Operadores_Relacionales, 1).inputs[input])
            return {transicion: T_Operadores_Relacionales, type: 'OPERADOR_RELACIONAL'} 

        return null
    }
    private Advance(state: number, input: string, transicion : T) : boolean {
        const estado = this.getEstado(transicion, state)
        if (!estado) 
            return false

        if (estado.inputs[input] !== undefined && input !== "otro") {
            return true
        }

        return false
    }

    private getNewState(state: number, input: string, transicion : T): number{
        const estado = transicion.find(t => t.estado === state)
        if(!estado)
            return -1

        return estado.inputs[input] ?? estado.inputs["otro"] ?? -1
    }
    private codigoProfe(transicion : T){
        let state = 1
        let char = this.codigo[this.posicion]
        let lexema = ""

        let newState, input
        while(!this.Accept(state) && !this.error(state) && this.posicion < this.codigo.length){
            input = this.getInput(char)
            newState = this.getNewState(state, input, transicion)
            if(this.Advance(state, input, transicion)){
                lexema += char
                this.incrementarPosicion()
                char = this.codigo[this.posicion]
            }
            state = newState
        }

        const isOk = this.Accept(state)
        const token : Token = isOk ? {type: '', valor: lexema} : {type: 'ERROR', valor: `Sintaxis inválida cerca de: ${lexema}`}

        return {
            accept: isOk,
            token
        }
    }
    public ejecutarReconocedores() : Token[]{
        const tokens : Token[] = []
        const palabrasReservadas = ['if', 'else', 'read', 'print', 'while', 'int', 'bool', 'true', 'false']

        let transicion : {transicion : T, type: TypeToken} | null, input : string, char : string
        while(this.posicion < this.codigo.length){

            char = this.codigo[this.posicion]
            if(char === ' ' || char === '\n' || char === '\t' || char === '\r'){
                this.incrementarPosicion()
                continue
            }

            const isPunto = Puntos.find(p => p[char])

            if(isPunto){
                tokens.push(isPunto[char])
                this.incrementarPosicion()
                continue
            }

            let isOperador = Operadores_Aritmeticos.find(oa => oa[char])
            
            if(isOperador && isOperador[char].valor !== this.codigo[this.posicion + 1]){
                tokens.push(isOperador[char])
                this.incrementarPosicion()
                continue
            }

            input = this.getInput(this.codigo[this.posicion])
            transicion = this.getTransicion(input)

            if (!transicion) {
                tokens.push({ type: 'ERROR', valor: `${this.codigo[this.posicion]}` })
                this.incrementarPosicion()
                continue
            }

            const resultado = this.codigoProfe(transicion.transicion)

            if(resultado.accept){
                const token : Token = resultado.token
                token.type = transicion.type

                if(token.valor === '='){
                    token.type = 'OPERADOR_ASIGNACION'
                }

                if (token.type === 'RESERVADA') {
                    if (!palabrasReservadas.includes(token.valor)) {
                        token.type = 'ERROR'
                        token.valor = `Token ${token.valor} no es reconocido`
                    }
                }

                tokens.push(token)
            }else{
                tokens.push(resultado.token)
                if(resultado.token.valor === '')
                    this.incrementarPosicion()
            }

        }

        return tokens
    }

    private incrementarPosicion(){
        this.posicion++
    }

}