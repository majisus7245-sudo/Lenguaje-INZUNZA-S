import { useState } from "react"
import type { FilaCI } from "../compilador/codigoIntermedio"
import type { FilaASM } from "../types"
import { formatearASM } from "../utils"

type Vista = "CI" | "ASM"

type Props = {
  ci: FilaCI[] | null
  asm: FilaASM[] | null
  compilado: boolean
  errores: string[]
  parserFallo: boolean
  mostrar: boolean
  setMostrar: React.Dispatch<React.SetStateAction<boolean>>
}

export default function CodigoIntermedio({ ci, asm, compilado, errores, parserFallo, mostrar, setMostrar }: Props) {
  const [vista, setVista] = useState<Vista>("CI")
  const [copiado, setCopiado] = useState(false)

  const textoASM = asm ? formatearASM(asm) : ""

  const abrir = (nueva: Vista) => {
    setVista(nueva)
    setMostrar(true)
  }

  const copiar = async () => {
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

  const claseBoton = (esta: Vista) =>
    `font-bold text-lg border-2 border-indigo-900 transition hover:cursor-pointer rounded-2xl w-[40%] py-1 ${
      mostrar && vista === esta ? "bg-indigo-900 text-white" : "text-indigo-900 hover:bg-indigo-900 hover:text-white"
    }`

  const nombreSalida = vista === "ASM" ? "el ensamblador" : "el código intermedio"

  let contenido
  if (!mostrar) {
    contenido = <p className="text-indigo-400 italic">Presiona un botón para ver el código intermedio o el ASM.</p>
  } else if (!compilado) {
    contenido = <p className="text-indigo-400 italic">Ejecuta Tokens para analizar el código.</p>
  } else if (parserFallo) {
    contenido = <p className="text-red-700">No se generó {nombreSalida}: hay un error en el parser.</p>
  } else if (errores.length > 0) {
    contenido = <p className="text-red-700">No se generó {nombreSalida}: corrige los errores semánticos.</p>
  } else if (vista === "ASM" && asm) {
    contenido = (
      <div className="relative w-full h-full border-2 border-indigo-100 rounded-lg bg-slate-50 text-left overflow-hidden">
        <button
          type="button"
          onClick={copiar}
          className={`absolute top-2 right-5 z-10 text-sm font-semibold border-2 border-indigo-900 rounded-xl px-3 py-0.5 transition hover:cursor-pointer ${
            copiado ? "bg-indigo-900 text-white" : "bg-white text-indigo-900 hover:bg-indigo-900 hover:text-white"
          }`}
        >
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
        <pre className="h-full m-0 p-3 overflow-auto font-mono text-sm leading-6 text-indigo-900 font-medium">
          <code>{textoASM}</code>
        </pre>
      </div>
    )
  } else if (vista === "CI" && ci) {
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
      <div className="flex gap-3 justify-center w-full mb-4 shrink-0">
        <button onClick={() => abrir("CI")} className={claseBoton("CI")}>
          Código Intermedio
        </button>
        <button onClick={() => abrir("ASM")} className={claseBoton("ASM")}>
          ASM
        </button>
      </div>
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">{contenido}</div>
    </div>
  )
}