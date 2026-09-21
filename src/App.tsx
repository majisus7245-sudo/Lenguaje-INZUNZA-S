import { useState } from "react";
import Codigo from "./components/Codigo";
import type { Token } from "./types";
import Tokens from "./components/Tokens";
import { compilar } from "./compilador";
import Modal from "./components/Modal";
import { useNavigate } from "react-router-dom";
import type { PROGRAMA } from "./compilador/ast";

export default function App() {
  const [codigo, setCodigo] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [parser, setParser] = useState<PROGRAMA | string>('');
  const [errors, setErrors] = useState<Token[]>([]);
  const [errorsSemantica, setErrorsSemantica] = useState<string[]>([]);
  const navigate = useNavigate()

  const handleTokens = () => {
    const { tokens, arbolParser, errores } = compilar(codigo);

    setTokens(tokens.filter(r => r.type !== 'ERROR'));
    setErrors(tokens.filter(r => r.type === 'ERROR'));

    setParser(arbolParser)

    setErrorsSemantica(errores)
  };

  const handleModal = (type : string) => {
    navigate(`/?modal=${type}`)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="bg-white mx-4 mt-4 rounded-2xl p-2 text-center shrink-0">
        <h1 className="font-bold text-3xl text-indigo-950">
          Lenguaje INZUNZA'S
        </h1>  
      </header>

      <main className="p-4 grid grid-cols-3 grid-rows-2 gap-3 flex-1 min-h-0">

        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <Codigo codigo={codigo} setCodigo={setCodigo} />  
        </section>
        
        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <Tokens handleTokens={handleTokens} tokens={tokens} />
        </section>
        
        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          <div className="flex flex-col flex-1 justify-around items-center">
            <button 
              onClick={() => handleModal('error')}
              className="font-bold text-lg mb-4 text-red-900 border-2 border-red-900 hover:bg-red-900 hover:text-white transition hover:cursor-pointer rounded-2xl w-[50%] py-1"
            >
              Errores
            </button>
            <button
              onClick={() => handleModal('parser')}
              className="font-bold text-lg mb-4 text-indigo-900 border-2 border-indigo-900 hover:bg-indigo-900 hover:text-white transition hover:cursor-pointer rounded-2xl w-[50%] py-1"
            >
              Parser
            </button>
            <button
              onClick={() => handleModal('semantica')}
              className="font-bold text-lg mb-4 text-indigo-900 border-2 border-indigo-900 hover:bg-indigo-900 hover:text-white transition hover:cursor-pointer rounded-2xl w-[50%] py-1"
            >
              Semantica
            </button>
          </div>
        </section>

        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">
          
        </section>

        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">

        </section>

        <section className="bg-white text-center p-2 rounded-2xl flex flex-col h-full overflow-hidden">

        </section>

      </main>

      <Modal errors={errors} parser={parser} erroresSemantica={errorsSemantica} />
    </div>
  );
}