import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useSearchParams } from 'react-router-dom';
import Error from './Error';
import Parser from './Parser';
import type { Token } from '../types';
import type { PROGRAMA } from '../compilador/ast';

type ModalProps = {
  errors: Token[];
  parser: PROGRAMA | string;
};

export default function Modal({ errors, parser }: ModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get('modal');
  const show = Boolean(modal && (modal === 'parser' || modal === 'error'));

  const handleClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('modal');
    setSearchParams(newParams);
  };

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all p-8 relative">
                
                {/* Botón de cerrar */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  X
                </button>

                {/* Título dinámico */}
                <Dialog.Title as="h3" className="font-bold text-2xl text-indigo-950 mb-4 border-b pb-2">
                  {modal === 'error' ? 'Errores de Compilación' : 'Sintaxis / Parser'}
                </Dialog.Title>

                {/* Contenido dinámico */}
                <div className="mt-4">
                  {modal === 'error' ? (
                    <Error errors={errors} />
                  ) : (
                    <Parser parser={parser} />
                  )}
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}