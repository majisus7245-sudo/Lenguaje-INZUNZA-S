import { AnalizadorLexico } from "./analizadorLexico";
import { PROGRAMA } from "./ast";
import { Parser } from "./parser";
import { Semantica } from "./semantica";
import { GeneradorCodigoIntermedio, type FilaCI } from "./codigoIntermedio";

export function compilar(codigo : string){
    
    const reconocedor = new AnalizadorLexico(codigo)
    const tokens = reconocedor.ejecutarReconocedores()

    const parser = new Parser(tokens)
    const programa = parser.iniciarParsing()

    const arbolParser = programa ? parser.getPrograma() : parser.getMsg()
    let semantica : Semantica | null = null
    let errores : string[] = []
    let codigoIntermedio : FilaCI[] | null = null
    if(arbolParser instanceof PROGRAMA){
        semantica = new Semantica(arbolParser)
        errores = semantica.analizar()

        // El código intermedio solo se genera si no hay errores semánticos
        if(errores.length === 0){
            codigoIntermedio = new GeneradorCodigoIntermedio(semantica.getTablaSimbolos()).generarCodigoIntermedio()
        }
    }

    return {
        tokens,
        arbolParser,
        errores,
        codigoIntermedio
    }
}