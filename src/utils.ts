import type { FilaASM } from "./types"

export function formatearASM(filas: FilaASM[]): string {
    return filas
        .map(f => {
            const etiqueta = f.etiqueta.padEnd(Math.max(12, f.etiqueta.length + 1))
            const instruccion = f.operandos
                ? f.instruccion.padEnd(Math.max(10, f.instruccion.length + 1))
                : f.instruccion
            return `${etiqueta}${instruccion}${f.operandos}`.trimEnd()
        })
        .join("\n")
}