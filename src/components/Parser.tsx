import { PROGRAMA } from "../compilador/ast"

type ParserProps = {
    parser : PROGRAMA | string
}

export default function Parser({parser} : ParserProps) {
  const contenidoJson = typeof parser !== 'string' && parser ? JSON.stringify(parser, null, 2) : 'No hay datos del parser aún';

  return (
    <div className="max-h-[60vh] overflow-auto rounded-lg bg-indigo-100 p-4 text-left">
        <pre className="m-0 whitespace-pre-wrap wrap-break-word font-mono text-sm leading-6 text-indigo-950 font-bold">
          <code>{contenidoJson}</code>
        </pre>
    </div>
  )
}
