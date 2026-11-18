import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react"
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

// ===================================================================
// IDs para relacionar el Código intermedio con el Código objeto
// (los usan CodigoIntermedio.tsx y CodigoObjeto.tsx)
// ===================================================================

// Selecciona el ID de la fila clicada; si ya estaba seleccionado, lo deselecciona.
// Las filas sin ID (directivas y etiquetas) no hacen nada.
export function alternarSeleccion(
    id: number | null,
    setIdSeleccionado: Dispatch<SetStateAction<number | null>>
) {
    if (id === null) return
    setIdSeleccionado(actual => (actual === id ? null : id))
}

// Clases de una fila: resaltada si su ID es el seleccionado, clicable si tiene ID.
export function claseFilaConId(id: number | null, idSeleccionado: number | null): string {
    if (id === null) return ""
    if (id === idSeleccionado) return "bg-amber-200 hover:cursor-pointer"
    return "hover:bg-indigo-100 hover:cursor-pointer"
}

// Cuando cambia el ID seleccionado, desplaza la tabla hasta la primera fila con ese ID.
export function useDesplazarASeleccion(
    contenedorRef: RefObject<HTMLDivElement | null>,
    idSeleccionado: number | null
) {
    useEffect(() => {
        if (idSeleccionado === null) return
        const fila = contenedorRef.current?.querySelector(`[data-id="${idSeleccionado}"]`)
        fila?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }, [contenedorRef, idSeleccionado])
}