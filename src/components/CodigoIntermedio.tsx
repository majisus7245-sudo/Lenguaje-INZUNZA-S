import { useRef, useState } from "react"
import type { FilaCI } from "../compilador/codigoIntermedio"
import type { FilaASMConId } from "../types"
import { alternarSeleccion, claseFilaConId, filasASMComoVista, formatearASM, useDesplazarASeleccion } from "../utils"

type Props = {
  // Se mantiene en la interfaz por compatibilidad con App; la tabla muestra el ASM.
  ci: FilaCI[] | null
  asm: FilaASMConId[] | null
  compilado: boolean
  errores: string[]
  parserFallo: boolean
  mostrar: boolean
  setMostrar: React.Dispatch<React.SetStateAction<boolean>>
  // IDs: fila seleccionada, compartida con el Código objeto
  idSeleccionado: number | null
  setIdSeleccionado: React.Dispatch<React.SetStateAction<number | null>>
}

export default function CodigoIntermedio({ asm, compilado, errores, parserFallo, mostrar, setMostrar, idSeleccionado, setIdSeleccionado }: Props) {
  const [copiado, setCopiado] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  useDesplazarASeleccion(contenedorRef, idSeleccionado)

  const textoASM = asm ? formatearASM(asm) : ""
  const filas = asm ? filasASMComoVista(asm) : []

  // Solo se puede copiar cuando la tabla se está mostrando con contenido real.
  const hayContenido = mostrar && compilado && !parserFallo && errores.length === 0 && !!asm && asm.length > 0

  const copiar = async () => {
    if (!hayContenido) return
    try {
      await navigator.clipboard.writeText(textoASM)
    } catch {
      // Respaldo para navegadores/contextos sin la API del portapapeles
      const area = document.createElement("textarea")
      area.value = textoASM
      document.body.appendChild(area)
      area.select()
      document.execCommand("copy")
      document.body.removeChild(area)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const claseBoton = (activo: boolean) =>
    `font-bold text-lg border-2 border-indigo-900 transition hover:cursor-pointer rounded-2xl w-[45%] py-1 ${
      activo ? "bg-indigo-900 text-white" : "text-indigo-900 hover:bg-indigo-900 hover:text-white"
    }`

  const claseCopiar = copiado
    ? "bg-indigo-900 text-white hover:cursor-pointer"
    : hayContenido
      ? "text-indigo-900 hover:bg-indigo-900 hover:text-white hover:cursor-pointer"
      : "text-indigo-900 opacity-40 cursor-not-allowed"

  let contenido
  if (!mostrar) {
    contenido = <p className="text-indigo-400 italic">Presiona "Código intermedio" para ver el ensamblador.</p>
  } else if (!compilado) {
    contenido = <p className="text-indigo-400 italic">Ejecuta Tokens para analizar el código.</p>
  } else if (parserFallo) {
    contenido = <p className="text-red-700">No se generó el ensamblador: hay un error en el parser.</p>
  } else if (errores.length > 0) {
    contenido = <p className="text-red-700">No se generó el ensamblador: corrige los errores semánticos.</p>
  } else if (asm) {
    contenido = (
      <div ref={contenedorRef} className="w-full h-full border-2 border-indigo-100 rounded-lg overflow-auto bg-slate-50 text-left">
        {filas.length === 0 ? (
          <div className="h-full flex items-center justify-center text-indigo-300 italic">
            No se generó código ensamblador.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-indigo-200 text-indigo-900 sticky top-0 shadow-sm">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Nombre</th>
                <th className="px-3 py-2 font-semibold">Operación</th>
                <th className="px-3 py-2 font-semibold">Atributos</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr
                  key={i}
                  data-id={asm[i].id ?? undefined}
                  onClick={() => alternarSeleccion(asm[i].id, setIdSeleccionado)}
                  className={`border-b border-indigo-100 font-mono text-indigo-800 font-medium ${claseFilaConId(asm[i].id, idSeleccionado)}`}
                >
                  <td className="px-3 py-2 text-indigo-400">{asm[i].id ?? ""}</td>
                  <td className="px-3 py-2 whitespace-pre">{f.nombre}</td>
                  <td className="px-3 py-2 whitespace-pre">{f.operacion}</td>
                  <td className="px-3 py-2 whitespace-pre">{f.atributos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center w-full">
      <div className="flex gap-3 justify-center w-full mb-4 shrink-0">
        <button onClick={() => setMostrar(true)} className={claseBoton(mostrar)}>
          Código Intermedio
        </button>
        <button
          type="button"
          onClick={copiar}
          disabled={!hayContenido}
          className={`font-bold text-lg border-2 border-indigo-900 transition rounded-2xl w-[45%] py-1 ${claseCopiar}`}
        >
          {copiado ? "¡Copiado!" : "Copiar ensamblador"}
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">{contenido}</div>
    </div>
  )
}
