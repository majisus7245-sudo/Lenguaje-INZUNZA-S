import type { DiccionarioTokens, T } from "../types";

export const T_Inicio_Codigo: T = [
    { estado: 1, inputs: { "<": 2 } },
    { estado: 2, inputs: { "!": 3, otro: -1 } },
    { estado: 3, inputs: { otro: 99 } }
]

export const T_Fin_Codigo: T = [
    { estado: 1, inputs: { "¡": 2 } },
    { estado: 2, inputs: { ">": 99, otro: -1 } }
]

export const T_Palabra_Reservada: T = [
    { estado: 1, inputs: { letra: 2 } },
    { estado: 2, inputs: { letra: 2, otro: 99 } }
]

export const T_Variable: T = [
    { estado: 1, inputs: { "_": 2 } },
    { estado: 2, inputs: { letra: 3, otro: -1 } },
    { estado: 3, inputs: { letra: 3, digito: 3, otro: 99 } }
]

export const T_Numero: T = [
    { estado: 1, inputs: { digito: 2 } },
    { estado: 2, inputs: { digito: 2, otro: 99 } }
]

export const T_Cadena: T = [
    { estado: 1, inputs: { "'": 2 } },  
    { estado: 2, inputs: 
        { letra: 2, digito: 2, espacio: 2, "'": 99 } 
    }
]

export const T_Operadores_Relacionales: T = [
    {estado : 1 , inputs: {
        "!" : 2, "=" : 3, "&" : 4, "|" : 5, "<" : 99, ">" : 99}},
    {estado : 2 , inputs: { "=" : 99, otro: -1 } },
    {estado : 3 , inputs: { "=" : 99, otro: 99 } },
    {estado : 4 , inputs: { "&" : 99, otro: -1 } },
    {estado : 5 , inputs: { "|" : 99, otro: -1 } }
]

export const Puntos: DiccionarioTokens = [
    {"{": { type: "PUNTO", valor: "{" }},
    {"}": { type: "PUNTO", valor: "}" }},
    {"(": { type: "PUNTO", valor: "(" }},
    {")": { type: "PUNTO", valor: ")" }},
    {";": { type: "PUNTO", valor: ";" }}
]

export const Operadores_Aritmeticos: DiccionarioTokens = [
    {"@": { type: "OPERADOR_ARITMETICO", valor: "@" }},
    {"#": { type: "OPERADOR_ARITMETICO", valor: "#" }},
    {"&": { type: "OPERADOR_ARITMETICO", valor: "&" }},
    {"|": { type: "OPERADOR_ARITMETICO", valor: "|" }},
]