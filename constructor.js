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
class BlockType {
    constructor(blockIdentifier, blockState, blockNBT = {}) {
        this.blockIdentifier = blockIdentifier;
        this.blockState = blockState;
        this.blockNBT = blockNBT
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
