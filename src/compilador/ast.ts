export interface ASTNode {
    type: string;
}

export class PROGRAMA implements ASTNode {
    public type: string = "PROGRAMA";
    public start: string = '<!';
    public body: DECLARACION[];
    public end: string = '¡>';
    constructor(declaraciones: DECLARACION[]) {
        this.body = declaraciones;
    }

}

export type DECLARACION = 
    | DECLARAR_VARIABLE 
    | ASIGNACION 
    | IF 
    | WHILE 
    | READ 
    | PRINT;

export class DECLARAR_VARIABLE implements ASTNode {
    public type: string = "DECLARAR_VARIABLE";
    public dataType: "int" | "bool";
    public variable: VARIABLE;

    constructor(dataType: "int" | "bool", variable: VARIABLE) {
        this.dataType = dataType;
        this.variable = variable;
    }
}

export class ASIGNACION implements ASTNode {
    public type: string = "ASIGNACION";
    public variable: VARIABLE;
    public valor: EXPRESION;

    constructor(variable: VARIABLE, valor: EXPRESION) {
        this.variable = variable;
        this.valor = valor;
    }
}

export class IF implements ASTNode {
    public type: string = "IF";
    public condition: EXPRESION;
    public then: DECLARACION[];
    public else: DECLARACION[] | null;

    constructor(condition: EXPRESION, thenBranch: DECLARACION[], elseBranch: DECLARACION[] | null = null) {
        this.condition = condition;
        this.then = thenBranch;
        this.else = elseBranch;
    }
}

export class WHILE implements ASTNode {
    public type: string = "WHILE";
    public condition: EXPRESION;
    public body: DECLARACION[];

    constructor(condition: EXPRESION, body: DECLARACION[]) {
        this.condition = condition;
        this.body = body;
    }
}

export class READ implements ASTNode {
    public type: string = "READ";
    public variable: VARIABLE;

    constructor(variable: VARIABLE) {
        this.variable = variable;
    }
}

export class PRINT implements ASTNode {
    public type: string = "PRINT";
    public argument: TERMINO | CADENA;

    constructor(argument: TERMINO | CADENA) {
        this.argument = argument;
    }
}

export type EXPRESION = TERMINO | DOBLE_EXPRESION;

export class TERMINO implements ASTNode {
    public type: string = "TERMINO";
    public valor: VARIABLE | NUMERO;
    constructor(valor: VARIABLE | NUMERO) {
        this.valor = valor;
    }
}

export class DOBLE_EXPRESION implements ASTNode {
    public type: string = "DOBLE_EXPRESION";
    public left: TERMINO;
    public operator: string;
    public right: TERMINO;

    constructor(left: TERMINO, operator: string, right: TERMINO) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

export class VARIABLE implements ASTNode {
    public type: string = "VARIABLE";
    public variable: string;

    constructor(variable: string) {
        this.variable = variable;
    }
}

export class NUMERO implements ASTNode {
    public type: string = "NUMERO";
    public value: string;

    constructor(value: string) {
        this.value = value;
    }
}

export class CADENA implements ASTNode {
    public type: string = "CADENA";
    public value: string;

    constructor(value: string) {
        this.value = value;
    }
}