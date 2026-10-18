import { AnalizadorLexico } from "./analizadorLexico";
import { PROGRAMA } from "./ast";
import { Parser } from "./parser";
import { Semantica } from "./semantica";
import { GeneradorCodigoIntermedio, type FilaCI } from "./codigoIntermedio";
import { GeneradorEnsamblador, type FilaASM } from "./ensamblador";

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
    if(arbolParser instanceof PROGRAMA){
        semantica = new Semantica(arbolParser)
        errores = semantica.analizar()

        if(errores.length === 0){
            codigoIntermedio = new GeneradorCodigoIntermedio(semantica.getTablaSimbolos()).generarCodigoIntermedio()
            ensamblador = new GeneradorEnsamblador(arbolParser, codigoIntermedio).generar()
        }
    }

    return {
        tokens,
        arbolParser,
        errores,
        codigoIntermedio,
        ensamblador
    }
}