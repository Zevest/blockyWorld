class Chunk {
    static width = 64;
    static height = 30;
    static depth = 64;
    static blockCheck;
    static facesOrder;

    constructor(x, y){
        this.x = x;
        this.y = y;
        this.id = `${x};${y}`;
        this.blockData = new Array(Chunk.width * Chunk.depth * Chunk.height).fill(-1);

        this.transparent_geometry;
        this.opaque_geomtry;

        this.transparent_BlockMeshData;
        this.opaque_BlockMeshData;

        this.chunk_obj;
        if(Chunk.blockCheck == undefined) {
            Chunk.blockCheck = []
            for(let i = -1; i <2; ++i){
                for(let j = -1; j < 2; ++j){
                    for(let k = -1; k < 2; ++k) {
                        if(i == j && j == k && k == 0) continue;
                        if((j | i) == 0 || (j | k) == 0 || (i | k) == 0) Chunk.blockCheck.push([i, j, k]);
                    }
                }
            }
            Chunk.facesOrder = [
                BLOCK.LEFT,
                BLOCK.BOTTOM,
                BLOCK.BACK,
                BLOCK.FRONT,
                BLOCK.TOP,
                BLOCK.RIGHT
            ]
        }

    }

    generateRandom(blockList) {
        /*for(let i = 0; i < Chunk.width; ++i){
            for(let j = 0; j < Chunk.height; ++j) {
                for(let k = 0; k < Chunk.depth; ++k) {
                    this.setBlock(Math.floor(Math.random() * blockList.length + 1) - 1);
                }
            }
        }*/
        const end = Chunk.width * Chunk.height * Chunk.depth;
        for(let i = 0; i < end; ++i) {
            this.blockData[i] = Math.floor(Math.random() * blockList.length +1) - 1;
        }
    }

    generateNoise(blockList) {
        for(let i = 0; i < Chunk.width; ++i){
            for(let k = 0; k < Chunk.depth; ++k) {
                let posX = this.x + i/Chunk.width;
                let posZ = this.y + k/Chunk.width;
                let sample = noise.perlin2(posX*5, posZ*5) * 0.2;
                //let sample2 = noise.perlin2(posX/10, posZ/10)*2;
                let sample3 = noise.perlin2(posX, posZ)*0.5;
                let height = Math.min(64, Chunk.height / 2 + Math.floor(2 *(sample + sample3)*(Chunk.height / 4)));
                for(let j = 0; j < height-4; ++j) { this.setBlock(blockList[0].id, i, j, k)}
                for(let j = height-4; j < height; ++j) {this.setBlock(blockList[1].id, i, j, k)};
                this.setBlock(blockList[2].id, i, height, k);
               // this.setBlock(blockList[31].id, i, height+1, k);
            }
        }
        
        //console.log(count, this.blockData);
    }

    setBlock(blockID, x, y, z) {
        if(x < 0 || x >= Chunk.width || y < 0 || y >= Chunk.height || z < 0 || z >= Chunk.depth) return;
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        this.blockData[index] = blockID;
    }

    static indexToCoord(index){
        let x = index % Chunk.depth
        let y = Math.floor(index / (Chunk.width*Chunk.depth))
        let z = Math.floor((index/Chunk.width) % Chunk.depth)
        return [x, y, z];
    }
    static coordToIndex(x, y, z){
        if(z == undefined){
            y = x[1];
            z = x[2];
            x = x[0];
        }
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        return index;
    }

    getBlock(x, y, z) {
        if(x == -1 || x == Chunk.width || z == -1 || z == Chunk.depth){
            //if(this.x == 0 && this.y == 0)  debugger;
            return this.getBlockFromNeighbourChunk(x, y, z);
        }
        if(x < -1 || x >= Chunk.width || y < 0 || y >= Chunk.height || z < -1 || z >= Chunk.depth) return -1;
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        return this.blockData[index];
    }

    getBlockFromNeighbourChunk(x, y, z) {
        let chunkX = this.x, chunkY = this.y, chunkData;
        switch(x){
            case -1:
                chunkData = World.currentWorld.chunks[World.chunkID(--chunkX, chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(Chunk.width-1, y, z)
                
            case Chunk.width:
                chunkData = World.currentWorld.chunks[World.chunkID(++chunkX, chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(0, y, z)
                
        }
        switch(z){
            case -1:
                chunkData = World.currentWorld.chunks[World.chunkID(chunkX, --chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(x, y, Chunk.depth-1)
                
            case Chunk.depth:
                chunkData = World.currentWorld.chunks[World.chunkID(chunkX, ++chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(x, y, 0)
                
        }
        /*if(this.x == 0 && this.y == 0){
            console.log(World.currentWorld.chunks, World.chunkID(chunkX, chunkY));
            console.log(x + chunkX * Chunk.width, y, z + chunkY * Chunk.depth);
        }
        let
        if(chunkData) return chunkData.getBlock(x + chunkX * Chunk.width, y, z + chunkY * Chunk.depth);*/
        return -1;
    }

    getBlockRenderedFace(x, y, z) {
        let face = 0, blockID;
        for(let i = 0; i < Chunk.blockCheck.length; ++i) {
            let dir = Chunk.blockCheck[i];
            blockID = this.getBlock(x + dir[0], y + dir[1], z + dir[2]);
            if(blockID < 0 || BlockData.TRANSPARENT_LIST[blockID]) {
                face |= Chunk.facesOrder[i];
            }
        }
        //if(blockID > -1)
        return face;
        
    }

}