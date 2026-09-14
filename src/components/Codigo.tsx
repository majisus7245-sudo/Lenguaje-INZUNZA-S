import Editor from "@monaco-editor/react";

type CodigoProps = {
    codigo : string
    setCodigo: React.Dispatch<React.SetStateAction<string>>
}

export default function Codigo({codigo, setCodigo} : CodigoProps) {

  const manejarCambio = (value: string | undefined) => {
    if (value !== undefined) {
      setCodigo(value);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="font-bold text-lg mb-2 text-indigo-900">
        Editor de Código
      </h2>
      
      <div className="flex-1 text-left border-2 border-indigo-100 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="plaintext" 
          value={codigo}
          onChange={manejarCambio}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            roundedSelection: false,
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}