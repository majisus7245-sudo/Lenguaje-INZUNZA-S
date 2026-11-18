import { useRef, useState } from "react"
import type { FilaCOConId } from "../types"
import { alternarSeleccion, claseFilaConId, formatearCO, useDesplazarASeleccion } from "../utils"

type Props = {
  codigoObjeto: FilaCOConId[] | null
  compilado: boolean
  errores: string[]
  parserFallo: boolean
  mostrar: boolean
  setMostrar: React.Dispatch<React.SetStateAction<boolean>>
  // IDs: fila seleccionada, compartida con el Código intermedio
  idSeleccionado: number | null
  setIdSeleccionado: React.Dispatch<React.SetStateAction<number | null>>
}

export default function CodigoObjeto({ codigoObjeto, compilado, errores, parserFallo, mostrar, setMostrar, idSeleccionado, setIdSeleccionado }: Props) {
  const [copiado, setCopiado] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  useDesplazarASeleccion(contenedorRef, idSeleccionado)

  const texto = codigoObjeto ? formatearCO(codigoObjeto) : ""

  // Solo se puede copiar cuando la tabla se está mostrando con contenido real.
  const hayContenido =
    mostrar && compilado && !parserFallo && errores.length === 0 && !!codigoObjeto && codigoObjeto.length > 0

  const copiar = async () => {
    if (!hayContenido) return
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const area = document.createElement("textarea")
      area.value = texto
      document.body.appendChild(area)
      area.select()
      document.execCommand("copy")
      document.body.removeChild(area)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const claseMostrar = mostrar
    ? "bg-indigo-900 text-white"
    : "text-indigo-900 hover:bg-indigo-900 hover:text-white hover:cursor-pointer"

  const claseCopiar = copiado
    ? "bg-indigo-900 text-white hover:cursor-pointer"
    : hayContenido
      ? "text-indigo-900 hover:bg-indigo-900 hover:text-white hover:cursor-pointer"
      : "text-indigo-900 opacity-40 cursor-not-allowed"

  let contenido
  if (!mostrar) {
    contenido = <p className="text-indigo-400 italic">Presiona "Código objeto" para ver el código objeto.</p>
  } else if (!compilado) {
    contenido = <p className="text-indigo-400 italic">Ejecuta Tokens para analizar el código.</p>
  } else if (parserFallo) {
    contenido = <p className="text-red-700">No se generó el código objeto: hay un error en el parser.</p>
  } else if (errores.length > 0) {
    contenido = <p className="text-red-700">No se generó el código objeto: corrige los errores semánticos.</p>
  } else if (codigoObjeto) {
    contenido = (
      <div ref={contenedorRef} className="w-full h-full border-2 border-indigo-100 rounded-lg overflow-auto bg-slate-50 text-left">
        {codigoObjeto.length === 0 ? (
          <div className="h-full flex items-center justify-center text-indigo-300 italic">
            No se generó código objeto.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-indigo-200 text-indigo-900 sticky top-0 shadow-sm">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Segmento</th>
                <th className="px-3 py-2 font-semibold">Dirección</th>
                <th className="px-3 py-2 font-semibold">Contenido</th>
                <th className="px-3 py-2 font-semibold">Hex</th>
              </tr>
            </thead>
            <tbody>
              {codigoObjeto.map((f, i) => (
                <tr
                  key={i}
                  data-id={f.id}
                  onClick={() => alternarSeleccion(f.id, setIdSeleccionado)}
                  className={`border-b border-indigo-100 font-mono text-indigo-800 font-medium ${claseFilaConId(f.id, idSeleccionado)}`}
                >
                  <td className="px-3 py-2 text-indigo-400">{f.id}</td>
                  <td className="px-3 py-2">{f.segmento}</td>
                  <td className="px-3 py-2 whitespace-pre">{f.direccion}</td>
                  <td className="px-3 py-2 whitespace-pre">{f.contenido}</td>
                  <td className="px-3 py-2">{f.hex}</td>
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
        <button
          type="button"
          onClick={() => setMostrar(true)}
          className={`font-bold text-lg border-2 border-indigo-900 transition rounded-2xl w-[45%] py-1 ${claseMostrar}`}
        >
          Código Objeto
        </button>
        <button
          type="button"
          onClick={copiar}
          disabled={!hayContenido}
          className={`font-bold text-lg border-2 border-indigo-900 transition rounded-2xl w-[45%] py-1 ${claseCopiar}`}
        >
          {copiado ? "¡Copiado!" : "Copiar código objeto"}
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">{contenido}</div>
    </div>
  )
}
