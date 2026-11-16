import { useState } from "react";
import Codigo from "./components/Codigo";
import type { FilaASM, FilaCO, Token } from "./types";
import Tokens from "./components/Tokens";
import { compilar } from "./compilador";
import Parser from "./components/Parser";
import Semantica from "./components/Semantica";
import type { PROGRAMA } from "./compilador/ast";
import type { FilaCI } from "./compilador/codigoIntermedio";
import CodigoIntermedio from "./components/CodigoIntermedio";
import CodigoObjeto from "./components/CodigoObjeto";

export default function App() {
  const [codigo, setCodigo] = useState(`<!
    int _x;
    int _y;
    _x = 2 & 2;
    _y = 12 | 3;
    int _z;
    if( _x > _y ){
        _z = _x @ _y;
    } else {
        _z = _y # _x;
    }
    print _z;
¡>`);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [parser, setParser] = useState<PROGRAMA | string>('');
  const [errorsSemantica, setErrorsSemantica] = useState<string[]>([]);
  const [vistaResultado, setVistaResultado] = useState<'parser' | 'semantica' | null>(null);
  const [compilado, setCompilado] = useState(false);
  const [ci, setCi] = useState<FilaCI[] | null>(null);
  const [ams, setASM] = useState< FilaASM[] | null>(null)
  const [codigoObjeto, setCodigoObjeto] = useState<FilaCO[] | null>(null)
  const [mostraCI, setMostrarCI] = useState(false)
  const [mostrarCO, setMostrarCO] = useState(false)

  const handleTokens = () => {
    const { tokens, arbolParser, errores, codigoIntermedio, ensamblador, codigoObjeto } = compilar(codigo);
    setTokens(tokens)
    setVistaResultado(null)
    setMostrarCI(false)
    setMostrarCO(false)
    setParser(arbolParser)
    setErrorsSemantica(errores)
    setCi(codigoIntermedio)
    setASM(ensamblador)
    setCodigoObjeto(codigoObjeto)
    setCompilado(true)
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white mx-4 mt-4 rounded-2xl p-2 text-center shrink-0">
        <h1 className="font-bold text-3xl text-indigo-950">
          Lenguaje INZUNZA'S
        </h1>  
      </header>

      <main className="p-4 grid grid-cols-6 grid-rows-2 gap-3 flex-1 min-h-0">

        <section className="col-span-2 bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <Codigo codigo={codigo} setCodigo={setCodigo} />  
        </section>
        
        <section className="col-span-2 bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <Tokens handleTokens={handleTokens} tokens={tokens} />
        </section>
        
        <section className="col-span-2 bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <div className="flex justify-center gap-3 shrink-0">
            <button
              onClick={() => setVistaResultado('parser')}
              className={`font-bold text-lg border-2 border-indigo-900 transition hover:cursor-pointer rounded-2xl w-[45%] py-1 ${vistaResultado === 'parser' ? 'bg-indigo-900 text-white' : 'text-indigo-900 hover:bg-indigo-900 hover:text-white'}`}
            >
              Parser
            </button>
            <button
              onClick={() => setVistaResultado('semantica')}
              className={`font-bold text-lg border-2 border-indigo-900 transition hover:cursor-pointer rounded-2xl w-[45%] py-1 ${vistaResultado === 'semantica' ? 'bg-indigo-900 text-white' : 'text-indigo-900 hover:bg-indigo-900 hover:text-white'}`}
            >
              Semantica
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3 flex flex-col justify-center">
            {!vistaResultado ? (
              <p className="text-indigo-400 italic">Selecciona Parser o Semantica.</p>
            ) : !compilado ? (
              <p className="text-indigo-400 italic">Ejecuta Tokens para analizar el código.</p>
            ) : vistaResultado === 'parser' ? (
              <Parser parser={parser} />
            ) : typeof parser === 'string' ? (
              <p className="text-red-700">No se pudo realizar el análisis semántico porque hay un error en el parser: {parser}</p>
            ) : (
              <Semantica errores={errorsSemantica} />
            )}
          </div>
        </section>

        <section className="col-span-3 bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <CodigoIntermedio ci={ci} asm={ams} compilado={compilado} errores={errorsSemantica} parserFallo={typeof parser === 'string'} mostrar={mostraCI} setMostrar={setMostrarCI} />
        </section>

        <section className="col-span-3 bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <CodigoObjeto
            codigoObjeto={codigoObjeto}
            compilado={compilado}
            errores={errorsSemantica}
            parserFallo={typeof parser === 'string'}
            mostrar={mostrarCO}
            setMostrar={setMostrarCO}
          />
        </section>

      </main>

    </div>
  );
}