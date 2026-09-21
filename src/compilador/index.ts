
import { AnalizadorLexico } from "./analizadorLexico";
import { PROGRAMA } from "./ast";
import { Parser } from "./parser";
import { Semantica } from "./semantica";

export function compilar(codigo : string){
    
    const reconocedor = new AnalizadorLexico(codigo)
    const tokens = reconocedor.ejecutarReconocedores()

    const parser = new Parser(tokens)
    const programa = parser.iniciarParsing()

    const arbolParser = programa ? parser.getPrograma() : parser.getMsg()
    let semantica : Semantica | null = null
    let errores : string[] = []
    if(arbolParser instanceof PROGRAMA){
        semantica = new Semantica(arbolParser)
        errores = semantica.analizar()
    }

    return {
        tokens,
        arbolParser,
        errores
    }
}