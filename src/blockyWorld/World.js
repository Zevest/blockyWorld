class World {
    static currentWorld;
    static range = 3;
    constructor(name, seed){
        this.name = name;
        this.seed = seed;
        this.chunks = {};
        this.world = new THREE.Object3D();
        this.world.position.set(0.5, 0.5, 0.5);
        this.materials;
    }

    initWorld() {
        noise.seed(this.seed);
        World.currentWorld = this;
    }

    generateWorld(){
        for(let i = -World.range; i <= World.range; ++i)
            for(let j = -World.range; j <= World.range; ++j){
                this.chunks[World.chunkID(i,j)] = new Chunk(i, j);
                this.chunks[World.chunkID(i,j)].generateNoise(BlockData.BLOCK_LIST);
            }
        /*this.chunks[World.chunkID(0,0)] = new Chunk(0,0);
        this.chunks[World.chunkID(0,0)].generateNoise(BlockData.BLOCK_LIST);
        this.chunks[World.chunkID(-1,0)] = new Chunk(-1,0);
        this.chunks[World.chunkID(-1,0)].generateNoise(BlockData.BLOCK_LIST);*/
    }

    static chunkID(x, y) {
        return `${x};${y}`;
    }

    generateMeshes(materials) {
        this.materials = materials;
        for(let id in this.chunks){
            let chunkData = this.chunks[id];
            let meshData = ChunkMesh.build(chunkData, this.materials);
            let chunkObject = new THREE.Object3D();
            chunkObject.name = World.chunkID(chunkData.x, chunkData.y);
            ChunkMesh.addToObject(chunkObject, meshData);
            chunkObject.position.set(chunkData.x * Chunk.width, 0, chunkData.y * Chunk.depth);
            this.world.add(chunkObject);
        }
    }

    addNewChunk(x, y){
        if(this.chunks[World.chunkID(x, y)]){
            
            return
        };
        let chunk = new Chunk(x,y);
        this.chunks[chunk.id] = chunk;
        chunk.generateNoise(BlockData.BLOCK_LIST);
        let chunkMesh = ChunkMesh.build(chunk, this.materials);
        let chunkObj = new THREE.Object3D();
        chunkObj.name = chunk.id;
        ChunkMesh.addToObject(chunkObj, chunkMesh);
        chunkObj.position.set(x * Chunk.width, 0, y * Chunk.depth);
        this.world.add(chunkObj);
        
        let toUpdate = [
            this.chunks[World.chunkID(x, y+1)],
            this.chunks[World.chunkID(x, y-1)],
            this.chunks[World.chunkID(x+1, y)],
            this.chunks[World.chunkID(x-1, y)]
        ];
        for(let cData of toUpdate){
            if(cData){
                let obj = this.world.getObjectByName(cData.id);
                this.updateChunk(obj, cData);
            }
            
        }
    }
    
    unloadChunkMesh(x, y){

        let chunk = this.chunks[World.chunkID(x, y)];
        if(!chunk) return;
        let chunkObj = this.world.getObjectByName(chunk.id);
        if(!chunkObj) return;
        chunkObj.userData.isLoaded = false;
        ChunkMesh.deleteData(chunkObj);
        this.world.remove(chunkObj);
        chunkObj = null;
    }

    loadChunkMesh(x, y){
        let chunk = this.chunks[World.chunkID(x, y)];
        if(!chunk) {
            this.addNewChunk(x,y);
            return;
        }
        let chunkObj = this.world.getObjectByName(chunk.id);
        if(!chunkObj || !chunkObj.userData.isLoaded){
            chunkObj = new THREE.Object3D();
            chunkObj.position.set(x * Chunk.width, 0, y * Chunk.depth);
            chunkObj.name = chunk.id;
            this.world.add(chunkObj);
        }
        if(!chunkObj.userData.isLoaded){
            let chunkMesh = ChunkMesh.build(chunk, this.materials);
            ChunkMesh.addToObject(chunkObj, chunkMesh);
        }
    }

    getBlock(x, y, z) {
        const pos = World.ToLocalCoord(x, y, z);
        const chunk = this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)];
        if(chunk) return chunk.getBlock(pos.x, pos.y, pos.z);
        return -1;
    }

    updateChunk(chunkObj, chunkData) {
        ChunkMesh.deleteData(chunkObj);
        let meshData = ChunkMesh.build(chunkData, this.materials);
        ChunkMesh.addToObject(chunkObj, meshData);
    }

    setBlock(blockID, x, y, z, update = true) {
        //let nearChunk = this.getNearbyChunk(x, y, z, 1, false);
        //nearChunk.shift();
        //console.log(nearChunk);
        const pos = World.ToLocalCoord(x, y, z);
        const cname =World.chunkID(pos.chunkX, pos.chunkZ);
        if(this.chunks[cname]){
            this.chunks[cname].setBlock(blockID, pos.x, pos.y, pos.z);
            if(!this.chunks[cname].isUpdating && update){
                this.chunks[cname].isUpdating = true;
                let chunkObj = this.world.getObjectByName(cname);
                this.updateChunk(chunkObj, this.chunks[cname]);
                this.chunks[cname].isUpdating = false;
            }
        }
        
    }

    getNearbyChunk(x, y, z, bdist = 3, diagonal = true) {
        let chunks = [];
        let pos = World.ToLocalCoord(x, y, z);
        if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)]){
            chunks.push(World.chunkID(pos.chunkX, pos.chunkZ));
        }
        let minX = false, maxX = false, minZ = false, maxZ = false;
        if(pos.x < bdist){
            minX = true;
            if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ)]){
                chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ));
            }
        }else if(pos.x > Chunk.width - bdist  - 1/*(pos.chunkX < 0)*/){
            maxX = true;
            if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ)]){
                chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ));
            }
        }
        if(pos.z < bdist){
            minZ = true;
            if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ-1)]){
                chunks.push(World.chunkID(pos.chunkX, pos.chunkZ-1));
            }

        }else if(pos.z > Chunk.depth - bdist - 1/*(pos.chunkZ < 0)*/){
            maxZ = true;
            if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ+1)]){
                chunks.push(World.chunkID(pos.chunkX, pos.chunkZ+1));
            }
        }
        if(diagonal){
            if(maxX && maxZ){
                if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ+1)]){
                    chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ+1));
                }
            }
            else if(maxX && minZ){
                if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ-1)]){
                    chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ-1));
                }
            }
            else if(minX && minZ){
                if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ-1)]){
                    chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ-1));
                }
            }
            else if(minX && maxZ){
                if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ+1)]){
                    chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ+1));
                }
            }
        }
        return chunks;
    }


    static ToLocalCoord(x, y, z) {
        let chunkX = Math.floor(x / Chunk.width);
        let rX = Math.floor((Chunk.width + (x % Chunk.width)) %Chunk.width);
        let chunkZ = Math.floor(z / Chunk.depth);
        let rZ = Math.floor((Chunk.depth + (z % Chunk.depth)) % Chunk.depth);
        return {chunkX, chunkZ, x: rX, y: Math.floor(y), z: rZ}
    }


}
