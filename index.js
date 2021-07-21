/*
** This file is licensed in BSD 2 Clause.
*/

let constructors = require("./constructor.js");
let {runNOS} = require("./nos.js");

Object.assign(exports, constructors);

let {BlockType} = constructors;

const emptyPlatform = {
    use() { /* no-op */ }
}

exports.emptyPlatform = emptyPlatform;

let VALID_COMMAND = [
    "nextGenerator",
    "perviousGenerator",
    "addPosition",
    "addBlockType",
    "addDirection",
    "removePosition",
    "removeBlockType",
    "removeDirection",
    "useItem",
    "isValidParameter",
    "generate",
    "UIHandler",
    "exit",
    "getCurrentGeneratorName",
    "getCurrentUI",
    "getCurrentState"
];

class System {
    constructor() {
        this._platform = null;
        this._generators = [];
        this._users = new Map();
        this._ids = new Map();
        this._auths = new Map();
        this._nativeNOSPrograms = new Map([
            ["set", programSet],
            ["add", programAdd]
        ]);
        this._namespaces = new Map();
    }
    /*
    ** Following functions are used by platform.
    ** If you are a generator developer,

    ** please don't rely on these functions.
    */
    inject(platform) {
        this._platform = platform;
    }
    createUser(id) {
        let user = new UserSystem(this);
        this._users.set(id, user);
        this._ids.set(user, id);
        user.init();
        return user;
    }
    hasUser(id) {
        return this._users.has(id);
    }
    getUser(id) {
        if(!this.hasUser(id)) {
            throw new Error(`unknown playid: ${id}
users: system: ${[...this._users.entries()]}`);
        }
        return this._users.get(id);
    }
    _getID(user) {
        return this._ids.get(user);
    }
    /*
    ** Following functions are used by users,

    ** If you are a generator developer,

    ** please don't rely on these functions.
    */
    removeUser(user) {
        let id = this._ids.get(user);
        this._users.delete(id);
        this._ids.delete(user);
    }
    getGenerators() {
        return Array.from(this._generators);
    }
    createRuntime(auth) {
        let runtime = this._platform.createRuntime(this._getID(auth.user));
        runtime = this._mixinSystemRuntime(runtime);
        runtime = this._hijack(runtime, auth);
        return runtime;
    }
    _createSubRuntime(runtime) {
        let auth = this._auths.get(runtime);
        let newAuth = Object.assign({}, auth);
        return this.createRuntime(newAuth);
    }
    _getCurrentState(runtime) {
        let auth = this._auths.get(runtime);
        if(!this._users.has(auth.user)) {
            throw new ReferenceError('No such user.')
        }
        return auth.user.getCurrentState();
    }
    _executeUserSystemCommand(runtime, command, ...args) {
        let auth = this._auths.get(runtime);
        if(!this._users.has(auth.user)) {
            throw new ReferenceError('No such user.')
        }
        if(VALID_COMMAND.find(command) === undefined) {
            throw new ReferenceError('No such command: ${command}.')
        }
        return auth.user[command](...args);
    }
    _mixinSystemRuntime(runtime) {
        runtime.createSubRuntime = this._createSubRuntime.bind(this, runtime);
        runtime.execl = this._execl.bind(this, runtime);
        runtime.execv = this._execv.bind(this, runtime);
        runtime.runNOS = runNOS.bind(undefined, runtime);
        runtime.getCurrentState = this._getCurrentState.bind(this, runtime);
        runtime.executeUserSystemCommand = this._executeUserSystemCommand.bind(this, runtime);
        return runtime;
    }
    _hijack(runtime, auth) {
        this._auths.set(runtime, auth);
        return runtime;
    }
    _findNOSProgram(name) {
        let nativProgram = this._nativeNOSPrograms.get(name);
        if(nativProgram !== undefined) {
            return nativProgram;
        }
        let names = name.split(".");
        let namespaceName = names.shift();
        let namespace = this._namespaces.get(namespaceName);
        for (name in names) {
            if(namespace === undefined) {
                break;
            }
            namespace = namespace[name];
        }
        if(namespace !== undefined) {
            return namespace;
        }
        return undefined;
    }
    _execv(runtime, name, input, args) {
        let program = this._findNOSProgram(name);
        if(program === undefined) {
            throw new ReferenceError(`There is no program called ${name}.`);
        }
        return program({
            runtime: runtime.createSubRuntime(),
            input,
            args
        });
    }
    _execl(runtime, name, input, ...args) {
        return this._execv(runtime, name, input, args);
    }
    /*
    ** Following functions are register API of system.
    */
    registerGenerator(generator) {
        this._generators.push(generator);
    }
    registerCanonicalGenerator(o) {
        this.registerGenerator(canonicalGeneratorFactory(o));
    }
    registerNOSProgram(name, programs) {
        this._namespaces.set(name, programs);
    }
}

function programSet(e) {
    let {runtime, args, input} = e;
    if(args[1] !== "o" && args[1] !== "option" && args[1] !== "s" && args[1] !== "state") {
        throw new Error(`${args[0]} can only set state.`);
    }
    let state = runtime.getCurrentState();
    set[args[2]] = args[3];
    return undefined;
}

function programAdd(e) {
    let {runtime, args, input} = e;
    if(args[1] !== "b") {
        throw new Error(`${args[0]} can only add blockType.`);
    }
    let blockType = new BlockType(args[2], JSON.parse(args[3]));
    runtime.executeUserSystemCommand("addBlockType", blockType);
    return undefined;
}


exports.System = System;

exports.systemInstance = new System();

class UserSystem {
    constructor(system) {
        this._system = system;
        this.session = {};
        this._generators = system.getGenerators();
        this._generatorStates = Array(this._generators.length);
        for(let i = 0; i < this._generatorStates.length; ++i) {
            this._generatorStates[i] = {};
        }
        this._generatorIndex = 0;
    }
    init() {
        for(let i = 0; i < this._generatorStates.length; ++i) {
            this._generators[i].onInit({
                state: this._generatorStates[i],
                runtime: this._createRuntime(this._generators[i]),
            });
        }
    }
    nextGenerator() {
        let oldGen = this._generators[this._generatorIndex];
        oldGen.onFocus && oldGen.onBlur({
            state: this._generatorStates[this._generatorIndex],
            position,
            runtime: this._createRuntime(oldGen),
        });
        this._generatorIndex++;
        this._generatorIndex %= this._generators.length;
        let newGen = this._generators[this._generatorIndex];
        newGen.onFocus && newGen.onFocus({
            state: this._generatorStates[this._generatorIndex],
            position,
            runtime: this._createRuntime(newGen),
        });
    }
    perviousGenerator() {
        let oldGen = this._generators[this._generatorIndex];
        oldGen.onFocus && oldGen.onBlur({
            state: this._generatorStates[this._generatorIndex],
            position,
            runtime: this._createRuntime(oldGen),
        });
        this._generatorIndex--;
        this._generatorIndex += this._generators.length;
        this._generatorIndex %= this._generators.length;
        let newGen = this._generators[this._generatorIndex];
        newGen.onFocus && newGen.onFocus({
            state: this._generatorStates[this._generatorIndex],
            position,
            runtime: this._createRuntime(newGen),
        });
    }
    addPosition(position) {
        let gen = this._generators[this._generatorIndex];
        gen.onAddPosition({
            state: this._generatorStates[this._generatorIndex],
            position,

            runtime: this._createRuntime(gen),
        });
    }
    addBlockType(blockType) {
        let gen = this._generators[this._generatorIndex];
        gen.onAddBlockType({
            state: this._generatorStates[this._generatorIndex],
            blockType,

            runtime: this._createRuntime(gen),
        });
    }
    addDirection(direction) {
        let gen = this._generators[this._generatorIndex];
        gen.onAddDirection({
            state: this._generatorStates[this._generatorIndex],
            direction,

            runtime: this._createRuntime(gen),
        });
    }
    removePosition(index) {
        let gen = this._generators[this._generatorIndex];
        gen.onRemovePosition({
            state: this._generatorStates[this._generatorIndex],
            index,

            runtime: this._createRuntime(gen),
        });
    }
    removeBlockType(index) {
        let gen = this._generators[this._generatorIndex];
        gen.onRemoveBlockType({
            state: this._generatorStates[this._generatorIndex],
            index,

            runtime: this._createRuntime(gen),
        });
    }
    useItem(data) {
        let gen = this._generators[this._generatorIndex];
        gen.onItemUsed && gen.onItemUsed({
            state: this._generatorStates[this._generatorIndex],
            data,

            runtime: this._createRuntime(gen),
        });
    }
    isValidParameter() {
        let gen = this._generators[this._generatorIndex];
        if(!gen.isValidParameter) return true;
        return gen.isValidParameter({
            state: this._generatorStates[this._generatorIndex],
            runtime: this._createRuntime(gen),
        });
    }
    generate() {
        let gen = this._generators[this._generatorIndex];
        return gen.generate({
            state: this._generatorStates[this._generatorIndex],
            runtime: this._createRuntime(gen),
        });
    }
    removeDirection(index) {
        let gen = this._generators[this._generatorIndex];
        gen.onRemoveDirection({
            state: this._generatorStates[this._generatorIndex],
            index,

            runtime: this._createRuntime(gen),
        });
    }
    UIHandler(data) {
        let gen = this._generators[this._generatorIndex];
        gen.UIHandler({
            data,

            state: this._generatorStates[this._generatorIndex],
            runtime: this._createRuntime(gen),
        });
    }
    exit() {
        for(let i = 0; i < this._generatorStates.length; ++i) {
            this._generators[i].onExit({
                state: this._generatorStates[i],
                runtime: this._createRuntime(this._generators[i]),
            });
        }
        this._system.removeUser(this);
    }
    getCurrentGeneratorName() {
        return this._generators[this._generatorIndex].name;
    }
    getCurrentUI() {
        return this._generators[this._generatorIndex].ui;
    }
    getCurrentState() {
        return this._generatorStates[this._generatorIndex];
    }
    runNOS(nos, input) {
        let runtime = this._createRuntime(this);
        return runtime.runNOS(nos, input);
    }
    execv(name, input, args) {
        let runtime = this._createRuntime(this);
        return runtime.execv(name, input, args);
    }
    execl(name, input, ...args) {
        let runtime = this._createRuntime(this);
        return runtime.execl(name, input, ...args);
    }
    _createGeneratorBasicE(index) {
        return {
            state: this._generatorStates[index],
            runtime: this._generatorIndex(this._generators[index]),
        }
    }
    _createRuntime(plugin) {
        return this._system.createRuntime({
            user: this,

            plugin,

        });
    }
}

exports.UserSystem = UserSystem;

function canonicalGeneratorFactory({
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
}) {
    function onAdd(type, arrayname) {
        return function (e) {
            let { state, runtime } = e;
            let { logger } = runtime;
            let data = e[type];
            let array = state[arrayname];
            let indexOfVacancy = array.indexOf(undefined);
            if (indexOfVacancy !== -1) {
                array[indexOfVacancy] = data
                logger && logger.log("info", `New ${type} accepted.`);
            } else {
                logger && logger.log("warning", `Too many ${type}s!New one is ignored`);
            }
        };
    }
    function onRemove(type, arrayname) {
        return function (e) {
            let { state, index, runtime } = e;
            let { logger } = runtime;
            let array = state[arrayname];
            if (index === undefined) {
                for (index = array.length - 1;
                     index >= 0 && array[index] == undefined;
                     index--);
            }
            if (index >= 0) array[index] = undefined;
            logger && logger.logObject("info", array);
        };
    }
    function createGenerate(generate, postGenerate) {
        return async function (e) {
            let result = await generate(e);
            await postGenerate(e);
            return result;
        };
    }
    function defaultPostGenerate(e) {
        let {state} = e;
        state.positions.fill(undefined);
        state.blockTypes.fill(undefined);
        state.directions.fill(undefined);
    }
    function defaultIsValidParameter(e) {
        let { state, runtime } = e;
        let result = "";
        if (state.blockTypes.indexOf(undefined) != -1)
            result += "Too few blockTypes!Refusing to execute.\n";
        if (state.positions.indexOf(undefined) != -1)
            result += "Too few positions!Refusing to execute.\n";
        if (state.directions.indexOf(undefined) != -1)
            result += "Too few directions!Refusing to execute.";
        if (result == "") return true;
        let { logger } = runtime;
        if(logger) logger.log("error", result);
        return false;
    }
    return {
        name: description.name,

        ui: description.usage.optionUsage,

        onInit(e) {
            let {state} = e;
            Object.assign(state, JSON.parse(JSON.stringify(option)));
            state.positions = new Array(positionArrayLength).fill(undefined);
            state.blockTypes = new Array(blockTypeArrayLength).fill(undefined);
            state.directions = new Array(directionArrayLength).fill(undefined);
        },
        onAddPosition: onAdd("position", "positions"),
        onAddBlockType: onAdd("blockType", "blockTypes"),
        onAddDirection: onAdd("direction", "directions"),
        onRemovePosition: onRemove("position", "positions"),
        onRemoveBlockType: onRemove("blockType", "blockTypes"),
        onRemoveDirection: onRemove("direction", "directions"),
        isValidParameter: defaultIsValidParameter,

        generate: createGenerate(generate, defaultPostGenerate),
        UIHandler,

        onExit(e) { /* no-op */ },
    }
}

exports.canonicalGeneratorFactory = canonicalGeneratorFactory;
