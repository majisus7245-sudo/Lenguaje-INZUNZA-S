import type { Token } from "../types"

type TokensProps = {
  handleTokens: () => void
  tokens: Token[]
}

export default function Tokens({ handleTokens, tokens }: TokensProps) {
  return (
    <div className="h-full flex flex-col items-center w-full">
      
      <button 
        className="font-bold text-lg mb-4 text-indigo-900 border-2 border-indigo-900 hover:bg-indigo-900 hover:text-white transition hover:cursor-pointer rounded-2xl w-[50%] py-1"
        onClick={handleTokens}
      >
        Tokens
      </button>

      <div className="flex-1 w-full border-2 border-indigo-100 rounded-lg overflow-auto bg-slate-50 text-left">
        
        {tokens.length === 0 ? (
          <div className="h-full flex items-center justify-center text-indigo-300 italic">
            Sin Tokens...
          </div>
        ) : (

          <table className="w-full text-sm">
            <thead className="bg-indigo-200 text-indigo-900 sticky top-0 shadow-sm">
              <tr>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Valor</th>
              </tr>
            </thead>
            
            <tbody>
              {tokens.map((token, index) => (
                <tr 
                  key={index} 
                  className="border-b border-indigo-100 hover:bg-indigo-100/50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <span className="bg-indigo-900 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                      {token.type}
                    </span>
                  </td>

                  <td className="px-3 py-2 font-mono text-indigo-800 font-medium">
                    {token.valor}
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
          
        )}
      </div>
      
    </div>
  )
}