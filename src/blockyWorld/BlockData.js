class BlockData {
    static BLOCK_LIST = [];
    static TRANSPARENT_LIST = [];
    static BLOCK_TYPE = [];
    static UV_TYPE = []
    constructor(block, name, id) {
        this.block = block;
        this.name = name;
        this.id = id;
        this.face = {}
        if(this.block.uvType == "simple" || this.block.uvType == "cross") {
            this.face.top = this.block.face;
            this.face.front = this.block.face;
            this.face.left = this.block.face;
            this.face.right = this.block.face;
            this.face.back = this.block.face;
            this.face.bottom = this.block.face;
        }
        if(this.block.uvType == "3-side-V") {
            this.face.top = this.block.faces.top;
            this.face.front = this.block.faces.side;
            this.face.left = this.block.faces.side;
            this.face.right = this.block.faces.side;
            this.face.back = this.block.faces.side;
            this.face.bottom = this.block.faces.bottom;
        }
        if(this.block.uvType == "4-side") {
            this.face.top = this.block.faces.top;
            this.face.front = this.block.faces.front;
            this.face.left = this.block.faces.side;
            this.face.right = this.block.faces.side;
            this.face.back = this.block.faces.side;
            this.face.bottom = this.block.faces.bottom;
        }
    }
    static initBlockList(tiles) {
        let i = 0;
        for(let block of tiles){
            const objName = Object.keys(block)[0];
            
            //debugger;
            BlockData.BLOCK_LIST.push(new BlockData(block[objName], objName, i++));
            //console.log()
            let isTransparent = block[objName].type == "cross_transparent" || block[objName].type == "block_transparent";
            let isSmaller = false;
            if(block[objName].properties && block[objName].properties.size){
                let size = block[objName].properties.size;
                isSmaller = (size.x < 1 || size.y < 1 || size.z < 1);
            }
            BlockData.TRANSPARENT_LIST.push(isTransparent || isSmaller);
        }
    }
    getUVRect(face) {
        let tile = BlockInfo.getTileFromName(face);

        let rX = tile.id % BlockInfo.tileSetInfo.columns,
            rY = Math.floor(tile.id / BlockInfo.tileSetInfo.columns);
        let ax = rX *  BlockInfo.unit;
        let ay = 1 - rY *  BlockInfo.unit;
        let bx = (rX+1) *  BlockInfo.unit;
        let by = 1 - (rY+1) * BlockInfo.unit;
        let uv = [ax, by, bx, by, ax, ay, bx, ay];
        return uv;
    }
    getUVCross(face) {
        let tile = BlockInfo.getTileFromName(face);
        let rX = (tile.id % BlockInfo.tileSetInfo.columns) - 1,
            rY = Math.floor(tile.id / BlockInfo.tileSetInfo.columns);
        let ax = rX * BlockInfo.unit;
        let ay = rY * BlockInfo.unit;
        let bx = (rX+1) * BlockInfo.unit;
        let by = (rY+1) * BlockInfo.unit;
    
        let uv = [
            ax, by, ax, ay, bx, by, bx, ay, ax, by, ax, ay, bx, by, bx, ay,
            bx, by, bx, ay, ax, by, ax, ay, bx, by, bx, ay, ax, by, ax, ay
           
        ];
        return uv;
    }
}