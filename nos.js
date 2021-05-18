/*
** This file is licensed in BSD 2 Clause.
*/

class Token{
    constructor(typeName, offset, length, raw, value) {
        return {typeName, offset, length, raw, value};
    }
}

function saferEval(literal) {
    return new Function(`return ${literal};`)();
}

function lex(string) {
    // This doesn't consider UTF-32, which may be fixed soon
    let tokens = [];
    let raw = "";
    let STATES = {
        NORMAL: "NORMAL",
        IN_STRING: "IN_STRING",
        ESCAPE: "ESCAPE"
    };
    let index = 0;
    let quotationMark = undefined;
    let state = STATES.NORMAL;
    for(let i = 0; i < string.length; ++i) {
        let ch = string[i];
        switch(state) {
        case STATES.NORMAL:
            switch(ch) {
            case "\"":
            case "'":
            case "`":
                if(raw !== "") {
                    tokens.push(new Token("directLiteral", index, raw.length, raw, raw));
                }
                raw = ch;
                index = i;
                quotationMark = ch;
                state = STATES.IN_STRING;
                break;
            case " ":
                if(raw !== "") {
                    tokens.push(new Token("directLiteral", index, raw.length, raw, raw));
                }
                raw = "";
                index = i + 1;
                break;
            case "|":
                if(raw !== "") {
                    tokens.push(new Token("directLiteral", index, raw.length, raw, raw));
                }
                raw = "|";
                index = i;
                tokens.push(new Token("operator", index, raw.length, raw, raw));
                raw = "";
                index = i + 1;
                break;
            default:
                raw += ch;
                break;
            }
            break;
        case STATES.IN_STRING:
            switch(ch) {
            case "\\":
                raw += ch;
                state = STATES.ESCAPE;
                break;
            case quotationMark:
                raw += ch;
                if(quotationMark === "`") {
                    throw new SyntaxError("Template literal is still not support.");
                }
                tokens.push(new Token("stringLiteral", index, raw.length, raw, saferEval(raw)));
                raw = "";
                index = i + 1;
                quotationMark = undefined;
                state = STATES.NORMAL;
                break;
            default:
                raw += ch;
                break;
            }
            break;
        case STATES.ESCAPE:
            switch(ch) {
            default:
                raw += ch;
                state = STATES.IN_STRING;
                break;
            }
            break;
        default:
            throw new Error("This never happen!");
            break;
        }
    }
    if(state !== STATES.NORMAL) {
        throw new SyntaxError(`Unclosed string literal ${raw}.`);
    }
    if(raw !== "") {
        tokens.push(new Token("directLiteral", index, raw.length, raw, raw));
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
