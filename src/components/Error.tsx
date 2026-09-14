import type { Token } from "../types"

type ErrorProps = {
  errors: Token[]
}

export default function Error({ errors }: ErrorProps) {
  return (
    <div className="h-full w-full flex flex-col p-4">

      {errors.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic">
          Sin Errores...
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto pr-2">
          {errors.map((error, index) => (
            <p 
              key={index} 
              className="bg-red-50 border-l-4 border-red-800 text-red-900 font-mono text-sm p-3 rounded-r-md shadow-sm wrap-break-word"
            >
              {error.valor}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}