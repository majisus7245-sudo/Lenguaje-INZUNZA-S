
export default function Semantica({ errores }: { errores: string[] }) {

  return (
    <div>
        {errores.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                Sin Errores Semánticos
            </div>
        ) :(
            <ul>
                {errores.map((error, index) => (
                    <li key={index}
                        className="bg-red-50 border-l-4 border-red-800 text-red-900 font-mono text-sm p-3 rounded-r-md shadow-sm wrap-break-word"
                    >
                        {error}
                    </li>
                ))}
            </ul>
        )}
    </div>
  )
}
