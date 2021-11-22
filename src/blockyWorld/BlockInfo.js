class BlockInfo {
    static blocks = {}
    static tileSetInfo = {};
    static isReady = 0;
    static requestCount = 4;
    static shaders = {fragment: undefined, vertex: undefined};
    static initData(blockFilename, tileSetFileName, vertexShaderFileName, fragmentShaderFileName, doneCallback) {
        Request.requestFile(blockFilename, "json",
            (result) => {
                const jsonData =JSON.parse(result);
                BlockInfo.blocks = jsonData.blocks;
                BlockData.BLOCK_TYPE = jsonData.dataValues.blockType;
                BlockData.UV_TYPE = jsonData.dataValues.uvType;
                for(let block of BlockInfo.blocks){
                    let blockName = Object.keys(block)[0];
                    BlockInfo[blockName] = block[blockName];
                }
                if(++BlockInfo.isReady >= BlockInfo.requestCount){
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            });
        Request.requestFile(tileSetFileName, "json",
            (result) => {
                BlockInfo.tileSetInfo = JSON.parse(result);
                BlockInfo.tileSetInfo.fileLocation = tileSetFileName.substr(0, tileSetFileName.lastIndexOf("/")) + "/";
                BlockInfo.unit = BlockInfo.tileSetInfo.tilewidth / BlockInfo.tileSetInfo.imagewidth;
                if(++BlockInfo.isReady >= BlockInfo.requestCount){
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            }
        )
        Request.requestFile(vertexShaderFileName, "text",
            (result) => {
                BlockInfo.shaders.vertex = result;
                if(++BlockInfo.isReady >= BlockInfo.requestCount){
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            }
        )
        Request.requestFile(fragmentShaderFileName, "text",
            (result) => {
                BlockInfo.shaders.fragment = result;
                if(++BlockInfo.isReady >= BlockInfo.requestCount){
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            }
        )
    }


    static getTileFromName(tileName) {
        if(BlockInfo.tileSetInfo == undefined) return;
        
        for(let tile of BlockInfo.tileSetInfo.tiles){
            if(tile.type == tileName)
                return tile;
        }
    }

    static getTileFromID(id) {
        if(BlockInfo.tileSetInfo == undefined) return;
        return BlockInfo.tileSetInfo.tiles[id];
    }

    static getPropertyObject(properties){
        let obj = {}
        for(let p of properties){
            obj[p.name] = p.value;
        }
        return obj;
    }

}
