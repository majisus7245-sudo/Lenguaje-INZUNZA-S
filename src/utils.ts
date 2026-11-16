import type { FilaASM, FilaCO, FilaVista } from "./types"

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

// Convierte cada fila del ensamblador en las 3 columnas que pide la interfaz:
// Nombre (etiqueta), Operacion (instruccion/directiva) y Atributos (operandos).
export function filasASMComoVista(filas: FilaASM[]): FilaVista[] {
    return filas.map(f => ({
        nombre: f.etiqueta,
        operacion: f.instruccion,
        atributos: f.operandos
    }))
}

export function formatearCO(filas: FilaCO[]): string {
    return filas
        .map(f => `${f.segmento.padEnd(7)}${f.direccion.padEnd(21)}${f.contenido.padEnd(11)}${f.hex}`.trimEnd())
        .join("\n")
}