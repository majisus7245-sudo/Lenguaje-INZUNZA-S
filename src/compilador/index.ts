
import { AnalizadorLexico } from "./analizadorLexico";
import { Parser } from "./parser";

export function compilar(codigo : string){
    
    const reconocedor = new AnalizadorLexico(codigo)
    const tokens = reconocedor.ejecutarReconocedores()

    const parser = new Parser(tokens)
    const programa = parser.iniciarParsing()

    const arbolParser = programa ? parser.getPrograma() : parser.getMsg()

    return {
        tokens,
        arbolParser
    }
}