import { AnalizadorLexico } from "./analizadorLexico";
import { PROGRAMA } from "./ast";
import { Parser } from "./parser";
import { Semantica } from "./semantica";
import { GeneradorCodigoIntermedio, type FilaCI } from "./codigoIntermedio";
import { GeneradorEnsamblador } from "./ensamblador";
import { GeneradorCodigoObjeto } from "./codigoObjeto";
import type { FilaASMConId, FilaCOConId } from "../types";

export function compilar(codigo : string){
    
    const reconocedor = new AnalizadorLexico(codigo)
    const tokens = reconocedor.ejecutarReconocedores()

    const parser = new Parser(tokens)
    const programa = parser.iniciarParsing()

    const arbolParser = programa ? parser.getPrograma() : parser.getMsg()
    let semantica : Semantica | null = null
    let errores : string[] = []
    let codigoIntermedio : FilaCI[] | null = null
    let ensamblador : FilaASMConId[] | null = null
    let codigoObjeto : FilaCOConId[] | null = null
    if(arbolParser instanceof PROGRAMA){
        semantica = new Semantica(arbolParser)
        errores = semantica.analizar()

        if(errores.length === 0){
            codigoIntermedio = new GeneradorCodigoIntermedio(semantica.getTablaSimbolos()).generarCodigoIntermedio()
            const filasASM = new GeneradorEnsamblador(arbolParser, codigoIntermedio).generar()
            // generarConIds relaciona cada fila del ensamblador con los bytes que produjo
            const conIds = new GeneradorCodigoObjeto(filasASM).generarConIds()
            ensamblador = conIds.asm
            codigoObjeto = conIds.co
        }
    }

    return {
        tokens,
        arbolParser,
        errores,
        codigoIntermedio,
        ensamblador,
        codigoObjeto
    }
}