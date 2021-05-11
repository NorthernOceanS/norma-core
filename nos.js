/*
** This file is licensed in BSD 2 Clause.
*/

let TOKEN_TYPES = [
    {
        name: "operator",
        regExp: /\|/u,
        toValue: (a) => a,
    },
    {
        name: "stringLiteral",
        regExp: /"(?:[^\\"]|\\.|\\u\d{4}|\\u\{\d*\})*"|'(?:[^\\']|\\.|\\u\d{4}|\\u\{\d*\})*'/u,
        toValue: saferEval,
    },
    {
        name: "templateLiteral",
        regExp: /`(?:[^\\`]|\\.|\\u\d{4}|\\u\{\d*\})*`?/u,
        toValue: () => {throw new SyntaxError("Template literal is still not support.")},
    },
    {
        name: "directLiteral",
        regExp: /[^"'`\|\s]+/u,
        toValue: (a) => a,
    },
    {
        name: "unclosedStringLiteral",
        regExp: /"(?:[^\\"]|\\.|\\u\d{4}|\\u\{\d*\})*$|'(?:[^\\']|\\.|\\u\d{4}|\\u\{\d*\})*$/u,
        toValue: (raw) => {throw new SyntaxError(`Unclosed string literal ${raw}.`)},
    },
];

class Token{
    constructor(typeName, offset, length, raw, value) {
        return {typeName, offset, length, raw, value};
    }
}

function saferEval(literal) {
    return new Function(`return ${literal};`)();
}

function lex(string) {
    let tokenRegExp = new RegExp(`(\\s*)(${TOKEN_TYPES.map((t) => t.regExp.source).join("|")})\\s*`, 'gu');
    let result;
    let tokens = [];
    while((result = tokenRegExp.exec(string))) {
        let raw = result[2];
        let typeIndex = TOKEN_TYPES.findIndex((t) => new RegExp(t.regExp, 'uy').test(raw));
        let type = TOKEN_TYPES[typeIndex];
        if(typeIndex === -1) {
            throw new SyntaxError(`Unknown token ${raw}`);
        }
        tokens.push(new Token(type.name, result.index + result[1].length, raw.length, raw, type.toValue(raw)));
    }
    return tokens;
}

exports.lex = lex;

function runNOS(runtime, nos, input) {
    let tokens = lex(nos);
    return tokens.reduce((argss, token) => {
        if(token.typeName === "operator" && token.value === "|") {
            argss.push([]);
        } else {
            argss[argss.length - 1].push(token.value);
        }
    }, [[]])
    .reduce((input, args) => {
        if(args.length === 0) {
            throw new SyntaxError("Unexpected token |");
        }
        runtime.execv(args[0], input, args);
    }, input)
}

exports.runNOS = runNOS;
