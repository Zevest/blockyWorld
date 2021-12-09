/// Stock toutes les Information necessaire au calcule des positons et dimension des texture des block
class BlockInfo {
    static blocks = {}
    static tileSetInfo = {}; // Contient les details sur les tiles (genere avec le logiciel Tiled)
    static isReady = 0;
    static requestCount = 2;

    // Charge 2 fichier json et traites les donnees
    // Le premier fichier contient des informations sur les blocs, leur face et plus
    // Le second fichier contient des informations sur les l'atlas de texture.
    static initData(blockFilename, tileSetFileName, doneCallback) {
        Request.getFile(blockFilename,
            (result) => {
                const jsonData =JSON.parse(result);
                BlockInfo.blocks = jsonData.blocks;
                BlockData.BLOCK_TYPE = jsonData.dataValues.blockType;
                BlockData.UV_TYPE = jsonData.dataValues.uvType;
                for(let block of BlockInfo.blocks) {
                    let blockName = Object.keys(block)[0];
                    BlockInfo[blockName] = block[blockName];
                }
                if(++BlockInfo.isReady >= BlockInfo.requestCount) {
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            });
        Request.getFile(tileSetFileName,
            (result) => {
                BlockInfo.tileSetInfo = JSON.parse(result);
                BlockInfo.tileSetInfo.fileLocation = tileSetFileName.substr(0, tileSetFileName.lastIndexOf("/")) + "/";
                BlockInfo.unit = BlockInfo.tileSetInfo.tilewidth / BlockInfo.tileSetInfo.imagewidth;
                if(++BlockInfo.isReady >= BlockInfo.requestCount) {
                    BlockData.initBlockList(BlockInfo.blocks);
                    doneCallback();
                }
            }
        )
    }

    /// Renvoie les donnes du tile demande a partir de son nom
    static getTileFromName(tileName) {
        if(BlockInfo.tileSetInfo == undefined) return;
        
        for(let tile of BlockInfo.tileSetInfo.tiles) {
            if(tile.type == tileName)
                return tile;
        }
    }

    /// Renvoie les donnes du tile demande a partir de son id
    static getTileFromID(id) {
        if(BlockInfo.tileSetInfo == undefined) return;
        return BlockInfo.tileSetInfo.tiles[id];
    }

    /// Renvoie un objet construit a partir de la liste "property" genere par Tiled
    static getPropertyObject(properties) {
        let obj = {}
        for(let p of properties) {
            obj[p.name] = p.value;
        }
        return obj;
    }

}
