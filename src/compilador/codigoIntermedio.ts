import type { TablaSimbolos } from "./semantica"

export type FilaCI = {
    nombre: string
    directiva: string
    valor: string
}

export class GeneradorCodigoIntermedio {
    private tablaSimbolos: TablaSimbolos

    constructor(tablaSimbolos: TablaSimbolos) {
        this.tablaSimbolos = tablaSimbolos
    }

    public generarCodigoIntermedio(): FilaCI[] {
        const CI: FilaCI[] = []

        this.tablaSimbolos.getSimbolos().forEach(simbolo => {
            let directiva = ""

            if (simbolo.getTipo() === "int") {
                directiva = "DW" 
            } else if (simbolo.getTipo() === "bool") {
                directiva = "DB"
            }

            CI.push({
                nombre: simbolo.getNombre(),
                directiva,
                valor: "?"
            })
        })

        return CI
    }
}