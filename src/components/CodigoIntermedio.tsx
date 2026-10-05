import { useState } from "react"
import type { FilaCI } from "../compilador/codigoIntermedio"

type Props = {
  ci: FilaCI[] | null
  compilado: boolean
  errores: string[]
  parserFallo: boolean
}

export default function CodigoIntermedio({ ci, compilado, errores, parserFallo }: Props) {
  const [mostrar, setMostrar] = useState(false)

  let contenido
  if (!mostrar) {
    contenido = <p className="text-indigo-400 italic">Presiona el botón para ver el código intermedio.</p>
  } else if (!compilado) {
    contenido = <p className="text-indigo-400 italic">Ejecuta Tokens para analizar el código.</p>
  } else if (parserFallo) {
    contenido = <p className="text-red-700">No se generó código intermedio: hay un error en el parser.</p>
  } else if (errores.length > 0) {
    contenido = <p className="text-red-700">No se generó código intermedio: corrige los errores semánticos.</p>
  } else if (ci) {
    contenido = (
      <div className="w-full h-full border-2 border-indigo-100 rounded-lg overflow-auto bg-slate-50 text-left">
        {ci.length === 0 ? (
          <div className="h-full flex items-center justify-center text-indigo-300 italic">
            No hay variables declaradas.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-indigo-200 text-indigo-900 sticky top-0 shadow-sm">
              <tr>
                <th className="px-3 py-2 font-semibold">Variable</th>
                <th className="px-3 py-2 font-semibold">Directiva</th>
                <th className="px-3 py-2 font-semibold">Valor</th>
              </tr>
            </thead>
            <tbody>
              {ci.map(m => (
                <tr key={m.nombre} className="border-b border-indigo-100 font-mono text-indigo-800 font-medium">
                  <td className="px-3 py-2">{m.nombre}</td>
                  <td className="px-3 py-2">{m.directiva}</td>
                  <td className="px-3 py-2">{m.valor}</td>
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
      <button
        onClick={() => setMostrar(true)}
        className={`font-bold text-lg mb-4 border-2 border-indigo-900 transition hover:cursor-pointer rounded-2xl w-[50%] py-1 shrink-0 ${mostrar ? 'bg-indigo-900 text-white' : 'text-indigo-900 hover:bg-indigo-900 hover:text-white'}`}
      >
        Código Intermedio
      </button>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">{contenido}</div>
    </div>
  )
}