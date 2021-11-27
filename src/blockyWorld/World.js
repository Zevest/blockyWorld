class World {
    static currentWorld;
    static range = 6;
    constructor(name, seed){
        this.name = name;
        this.seed = seed;
        this.chunks = {};
        this.world = new THREE.Group();
        this.world.position.set(0.5, 0.5, 0.5);
        this.materials;
    }

    initWorld() {
        //noise.seed(this.seed);
        World.currentWorld = this;
    }

    generateWorld(){
        let dimension = {width: Chunk.width, height: Chunk.height, depth: Chunk.depth};
        
        for(let i = -World.range+1; i <= World.range; ++i)
            for(let j = -World.range+1; j <= World.range; ++j){
                this.chunks[World.chunkID(i,j)] = new Chunk(i, j);
                WorkerManager.sendMessage("generate", [dimension, {x:i,y:j}]);
                
                //this.chunks[World.chunkID(i,j)].generateNoise(BlockData.BLOCK_LIST);
            }
    }
    setChunk(x, y, chunkData){
        const id = World.chunkID(x, y);
        if(!this.chunks[id])
            this.chunks[id] = new Chunk(x, y)
        this.chunks[id].blockData = chunkData;
        
    }

    static chunkID(x, y) {
        return `${x};${y}`;
    }
    
    setMaterials(materials){
        this.materials = materials;
    }

    generateMeshes() {
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

    addChunk(meshData){
        let chunkObject = new THREE.Object3D();
        chunkObject.name = World.chunkID(meshData.x, meshData.y);
        ChunkMesh.addToObject(chunkObject, meshData);
        chunkObject.position.set(meshData.x * Chunk.width, 0, meshData.y * Chunk.depth);
        this.world.add(chunkObject);
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

        const pos = World.ToLocalCoord(x, y, z);
        const cname =World.chunkID(pos.chunkX, pos.chunkZ);
        if(this.chunks[cname]){
            this.chunks[cname].setBlock(blockID, pos.x, pos.y, pos.z);
            let chunkObj = this.world.getObjectByName(cname);
            if(!this.chunks[cname].isUpdating){
                this.chunks[cname].isUpdating = true;
                if(update) {
                    console.log("updating");
                    this.updateChunk(chunkObj, this.chunks[cname]);
                    this.chunks[cname].isUpdating = false;
                }
            }
        }
        
    }

    getNearbyChunk(x, y, z) {
        let chunks = [];
        let pos = World.ToLocalCoord(x, y, z);
        if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)]){
            chunks.push(World.chunkID(pos.chunkX, pos.chunkZ));
        }
        let minX = false, maxX = false, minZ = false, maxZ = false;

        const bdist = 3;
        if(pos.x < bdist){
            minX = true;
            if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ)]){
                chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ));
            }
        }else if(pos.x > Chunk.width - bdist){
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

        }else if(pos.z > Chunk.height - bdist){
            maxZ = true;
            if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ+1)]){
                chunks.push(World.chunkID(pos.chunkX, pos.chunkZ+1));
            }
        }

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
