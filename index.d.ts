/** Declaration file generated by dts-gen */

export class System {
    constructor(...args: any[]);

    createRuntime(...args: any[]): any;

    createUser(...args: any[]): any;

    getGenerators(...args: any[]): any;

    getUser(...args: any[]): any;

    hasUser(...args: any[]): any;

    inject(...args: any[]): any;

    registerCanonicalGenerator(...args: any[]): any;

    registerGenerator(...args: any[]): any;

    registerNOSProgram(...args: any[]): any;

    removeUser(...args: any[]): any;

}

export class UserSystem {
    constructor(...args: any[]);

    UIHandler(...args: any[]): any;

    addBlockType(...args: any[]): any;

    addDirection(...args: any[]): any;

    addPosition(...args: any[]): any;

    execl(...args: any[]): any;

    execv(...args: any[]): any;

    exit(...args: any[]): any;

    generate(...args: any[]): any;

    getCurrentGeneratorName(...args: any[]): any;

    getCurrentState(...args: any[]): any;

    getCurrentUI(...args: any[]): any;

    init(...args: any[]): any;

    isValidParameter(...args: any[]): any;

    nextGenerator(...args: any[]): any;

    perviousGenerator(...args: any[]): any;

    removeBlockType(...args: any[]): any;

    removeDirection(...args: any[]): any;

    removePosition(...args: any[]): any;

    runNOS(...args: any[]): any;

    useItem(...args: any[]): any;

}

export function Block(...args: any[]): void;

export function BlockType(...args: any[]): void;

export function BuildInstruction(...args: any[]): void;

export function Coordinate(...args: any[]): void;

export function Description(...args: any[]): void;

export function Direction(...args: any[]): void;

export function Generator(...args: any[]): void;

export function Position(...args: any[]): void;

export function Usage(...args: any[]): void;

export function canonicalGeneratorFactory({
    description,

    criteria: {
        positionArrayLength,

        blockTypeArrayLength,

        directionArrayLength
    },
    option,

    method: {
        generate, UIHandler
    }
}: any): void;

export namespace emptyPlatform {
    function use(...args: any[]): any;

}

