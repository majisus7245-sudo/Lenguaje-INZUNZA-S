export type Token = {
  type: TypeToken
  valor: string
};

export type TypeToken = "INICIO_CODIGO" |
        "FIN_CODIGO" |
        "RESERVADA" | 
        "VARIABLE" | 
        "NUMERO" | 
        "CADENA" | 
        "OPERADOR_RELACIONAL" | 
        "PUNTO" | 
        "OPERADOR_ARITMETICO" | 
        "OPERADOR_ASIGNACION" |
        "ERROR" | ""

export type Estado = {
  estado: number,
  inputs: {
    [key: string]: number | undefined;
    letra?: number;
    digito?: number;
    espacio?: number;
    otro?: number;
  },
}

export type T = Estado[]

export type DiccionarioTokens = {
    [key: string]: Token
}[]

export type FilaASM = {
    etiqueta: string
    instruccion: string
    operandos: string
}
