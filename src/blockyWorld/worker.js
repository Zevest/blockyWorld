self.importScripts("./../../vendor/noiseClass.js");
self.importScripts("./BlockData.js");
self.importScripts("./BlockInfo.js");
self.importScripts("./BlockMesh.js");
self.importScripts("./Chunk.js");
self.importScripts("./ChunkMesh.js");
self.importScripts("./../../vendor/three.min.js");
let noise = null;

self.addEventListener('message', (e) =>{
    const m = e.data;
    if(noise == null){
        noise = new Noise();
    }
    matchEventMessage(m);
    //self.close();
})

function matchEventMessage(m){
    let chunkData;
    switch(m.type){
        case "init":
        {
            BlockInfo.blocks = m.data[0].blocks;
            BlockInfo.tileSetInfo = m.data[0].tileSetInfo;
            BlockInfo.unit = m.data[0].unit;
            //console.log(m.data[0].tileSetInfo);
            BlockData.initBlockList(BlockInfo.tileSetInfo.tiles);
            //console.log(BlockData.BLOCK_LIST);
            /*BlockData.TRANSPARENT_LIST = m.data[1].TRANSPARENT_LIST;
            BlockData.BLOCK_TYPE = m.data[1].BLOCK_TYPE;
            BlockData.UV_TYPE = m.data[1].UV_TYPE;
            BlockData.BLOCK_LIST = m.data[1].BLOCK_LIST;*/
            return;
        }
        case "end":
        {
            console.log("end")
            self.postMessage(Message("end"));
            self.close();
            return;
        }
        case "generate":
        {
            let chunkData = GenerateChunkData(m.data[0], m.data[1]);
            //console.log(Chunk);
            self.postMessage(Message("generate", [m.data[1], chunkData]));
            //self.close();
            break;
        }
        case "build":
        {
            let chunkData = m.data;
            //console.log("chunkData", chunkData);
            let tmp = new Chunk(chunkData.chunk.x,chunkData.chunk.y);
            tmp.id = chunkData.chunk.id;
            tmp.blockData = chunkData.chunk.blockData;
            tmp.isUpdating = chunkData.chunk.isUpdating;
            let geometry = ChunkMesh.buildGeometry(tmp, chunkData.borders);
            geometry.x = tmp.x;
            geometry.y = tmp.y;
            self.postMessage(Message("build", geometry));
            break;
        }
        /*default:
            console.log("nothing");
            self.postMessage(Message("done"));
            break;*/
        /*case "Noise":
            console.log(noise);
            break;*/
        case "Seed":
        {
            let seed = m.data;
            noise.seed(seed);
            console.log("Seed", seed, noise);
            return;
        }
        /*case "info":
            console.log(BlockInfo.blocks);
            break;*/
    }
}

function Message(type, data){
    return {
        type,
        data,
    }
}

function setBlock(block , x, y, z, chunkData, dimension){
    if(x < 0 || x >= dimension.width || y < 0 || y >= dimension.height || z < 0 || z >= dimension.depth) return;
    let index = x + z * dimension.width + y * dimension.width * dimension.depth;
    chunkData[index] = block;
}

function GenerateChunkData(dimension, position) {
    blockList = BlockData.BLOCK_LIST;
    let chunkData  = new Array(dimension.width * dimension.depth * dimension.height).fill(-1);
    for(let i = 0; i < dimension.width; ++i){
        for(let k = 0; k < dimension.depth; ++k) {
            let posX = position.x + i/dimension.width;
            let posZ = position.y + k/dimension.width;
            let sample = noise.perlin2(posX, posZ) * 0.01;
            let sample2 = noise.perlin2(posX*0.5, posZ*0.5) * 0.05;
            let sample3 = noise.perlin2(posX*0.2, posZ*0.2)*0.4;
            let sample4 = noise.perlin2(posX*0.1, posZ*0.1)*0.2;
            let mult = noise.perlin2(posX*0.1+0.1, posZ*0.1+0.1);
            
            let height = Math.min(dimension.height/2+1, Math.max(1, dimension.height/ 2)) + Math.floor(2 *(sample + sample2 +  sample3 + sample4 * mult)*(dimension.height / 4));
            //console.log(height);
            //debugger;
            for(let j = 0; j < height-4; ++j) { 
                setBlock( blockList[0].id, i, j, k, chunkData, dimension);
            }//this.setBlock(blockList[0].id, i, j, k)}
            if(height > 100)
                for(let j = height-4; j < height; ++j) {
                    setBlock(blockList[48].id, i, j, k, chunkData, dimension);//[i + k * dimension.width + j * dimension.width * dimension.depth] = blockList[48].id;//this.setBlock(blockList[48].id, i, j, k)
                }
            
            else 
                for(let j = height-4; j < height; ++j) {
                    setBlock(blockList[1].id, i, j, k, chunkData, dimension);//chunkData[i + k * dimension.width + j * dimension.width * dimension.depth] = blockList[1].id//this.setBlock(blockList[1].id, i, j, k)
                }    
            
            
            //let index = i + k * dimension.width + height * dimension.width * dimension.depth;
            if(height > 100) 
                setBlock(blockList[49].id, i, height, k, chunkData, dimension);//chunkData[index] = blockList[49].id//this.setBlock(blockList[49].id, i, height, k);
            else if(height > 64) 
                setBlock(blockList[2].id, i, height, k, chunkData, dimension);//chunkData[index] = blockList[2].id//this.setBlock(blockList[2].id, i, height, k);
            else 
                setBlock(blockList[14].id, i, height, k, chunkData, dimension);//chunkData[index] = blockList[14].id//this.setBlock(blockList[14].id, i, height, k);
            
           // this.setBlock(blockList[31].id, i, height+1, k);
        }
    }
    return chunkData;
}

function buildChunkMesh(){

}