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

// Fila ya adaptada para mostrarse en la tabla de Codigo intermedio.
export type FilaVista = {
    nombre: string
    operacion: string
    atributos: string
}

// Fila de la tabla de Codigo objeto.
export type FilaCO = {
    segmento: "DATOS" | "CODIGO"
    direccion: string
    contenido: string
    hex: string
}
