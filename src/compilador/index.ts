import { AnalizadorLexico } from "./analizadorLexico";
import { PROGRAMA } from "./ast";
import { Parser } from "./parser";
import { Semantica } from "./semantica";
import { GeneradorCodigoIntermedio, type FilaCI } from "./codigoIntermedio";
import { GeneradorEnsamblador } from "./ensamblador";
import { GeneradorCodigoObjeto } from "./codigoObjeto";
import type { FilaASM, FilaCO } from "../types";

export function compilar(codigo : string){
    
    const reconocedor = new AnalizadorLexico(codigo)
    const tokens = reconocedor.ejecutarReconocedores()

    const parser = new Parser(tokens)
    const programa = parser.iniciarParsing()

    const arbolParser = programa ? parser.getPrograma() : parser.getMsg()
    let semantica : Semantica | null = null
    let errores : string[] = []
    let codigoIntermedio : FilaCI[] | null = null
    let ensamblador : FilaASM[] | null = null
    let codigoObjeto : FilaCO[] | null = null
    if(arbolParser instanceof PROGRAMA){
        semantica = new Semantica(arbolParser)
        errores = semantica.analizar()

        if(errores.length === 0){
            codigoIntermedio = new GeneradorCodigoIntermedio(semantica.getTablaSimbolos()).generarCodigoIntermedio()
            ensamblador = new GeneradorEnsamblador(arbolParser, codigoIntermedio).generar()
            codigoObjeto = new GeneradorCodigoObjeto(ensamblador).generar()
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