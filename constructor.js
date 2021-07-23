/*
** This file is licensed in BSD 2 Clause.
*/

//TODO:Wrap up the constructor && find better solution.
class Coordinate {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    add({ x, y, z }) {
        this.x += x;
        this.y += y;
        this.z += z;
    }
}
class Position {
    constructor(coordinate, dimension = "overworld") {
        this.coordinate = coordinate;
        this.dimension = dimension;
    }
}
function assertBlockstateEqual(a, b) {
    return a === b || (a && b && typeof a === "object" && typeof b === "object" && Object.keys(a).length === Object.keys(b) && Object.keys(a).every((property) => a[property] === b[property]))
}
class BlockType {
    static _blockMap = null
    constructor(blockIdentifier) {
        this.blockIdentifier = blockIdentifier;
        this._data = { "blockIdentifier": null, "blockstate": null, "tiledata": null };
        this._flag = { "blockstateUpToDate": false, "tiledataUpToDate": false };
    }
    static fromBlockstate(blockIdentifier, blockstate) {
        let blockType = new BlockType(blockIdentifier);
        blockType.blockstate = blockstate;
        return blockType;
    }
    static fromTiledata(blockIdentifier, tiledata) {
        let blockType = new BlockType(blockIdentifier);
        blockType.tiledata = tiledata;
        return blockType;
    }
    //The format of blockMap is expected to be in accordance with https://github.com/dzx-dzx/BlockJS/blob/main/Block.js. 
    static useBlockMap(blockMap) {
        this._blockMap = new Map(blockMap)
    }
    get blockstate() {
        if (this._flag.blockstateUpToDate) {
            return this._data.blockstate;
        }
        else {
            if (!BlockType._blockMap) return null
            const { id, data } = BlockType._blockMap.get(this.blockIdentifier) || {}
            if (!id || !data.hasOwnProperty(this.tiledata)) return null
            this._data.blockstate = data[this.tiledata]
            this._flag.blockstateUpToDate = true
            return this.blockstate
        };
    }
    set blockstate(blockstate) {
        this._data.blockstate = blockstate;
        this._flag.blockstateUpToDate = true;
        this._flag.tiledataUpToDate = false;
    }
    get tiledata() {
        if (this._flag.tiledataUpToDate) {
            return this._data.tiledata
        }
        else {
            if (!BlockType._blockMap) return null
            const { id, data } = BlockType._blockMap.get(this.blockIdentifier) || {}
            if (!id) return null
            for (const tiledata in data)
                if (assertBlockstateEqual(data[tiledata], this.blockstate)) {
                    this._data.tiledata = tiledata
                    return tiledata
                }
            return null;
        };
    }
    set tiledata(tiledata) {
        this._data.tiledata = tiledata;
        this._flag.tiledataUpToDate = true;
        this._flag.blockstateUpToDate = false;
    }
    get blockIdentifier() {
        return this._data.blockIdentifier;
    }
    set blockIdentifier(blockIdentifier) {
        this._data.blockIdentifier = blockIdentifier
        this._flag.tiledataUpToDate = false;
        this._flag.blockstateUpToDate = false;
        this.blockstate = null;
        this.tiledata = null;
    }
}
class Direction {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
class Block {
    constructor(position, blockType) {
        this.position = position;
        this.blockType = blockType;
    }
}


class Usage {
    constructor(positionUsage, blockTypeUsage, directionUsage, optionUsage) {
        this.positionUsage = positionUsage;
        this.blockTypeUsage = blockTypeUsage;
        this.directionUsage = directionUsage;
        this.optionUsage = optionUsage;
    }
}
class Description {
    constructor(name, usage) {
        this.name = name;
        this.usage = usage;
    }
}
//TODO:Refactor generator
class Generator {
    constructor(description,
        positionArray, blockTypeArray, directionArray, option,
        addPosition, addBlockType, addDirection,
        removePosition, removeBlockType, removeDirection,
        validateParameter, generate, postGenerate, UIHandler) {
        this.description = description;

        this.positionArray = positionArray;
        this.blockTypeArray = blockTypeArray;
        this.directionArray = directionArray;
        this.option = option;

        this.addPosition = addPosition;
        this.addBlockType = addBlockType;
        this.addDirection = addDirection;
        this.removePosition = removePosition;
        this.removeBlockType = removeBlockType;
        this.removeDirection = removeDirection;

        this.validateParameter = validateParameter;
        this.generate = generate;
        this.postGenerate = postGenerate;
        this.UIHandler = UIHandler;
    }
}

class BuildInstruction {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

module.exports = { Coordinate, Position, BlockType, Block, Direction, Usage, Description, Generator, BuildInstruction };
