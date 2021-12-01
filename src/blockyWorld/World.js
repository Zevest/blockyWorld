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
        this.chunkLoadingQueue = [];
        this.tick = 0;
        this.chunkPerUpdate = 1;
    }

    initWorld() {
        noise.seed(this.seed);
        World.currentWorld = this;
    }

    generateWorld(){
        for(let i = -World.range; i <= World.range; ++i)
            for(let j = -World.range; j <= World.range; ++j){
                this.chunkLoadingQueue.push({x:i,z:j});
                this.chunkLoadingQueue[World.chunkID(i,j)] = true;
            }
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
            ChunkMesh.addToObject(chunkObject, meshData, chunkData);
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
        ChunkMesh.addToObject(chunkObj, chunkMesh, chunk);
        chunk.isLoaded = true;
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
    
    update(cameraPos){
        ++this.tick;
        let outrange =  Math.sqrt(Math.pow(Chunk.width * (World.range+1), 2) + Math.pow(Chunk.depth * (World.range+1), 2));
        let inRange =  Math.sqrt(Math.pow(Chunk.width * World.range*2, 2) + Math.pow(Chunk.depth * World.range*2, 2));
        let tmp = World.ToLocalCoord(cameraPos.x, cameraPos.y, cameraPos.z);

        for(let j = -World.range; j <= World.range; ++j) {
            for(let i = -World.range; i <= World.range; ++i){
                let x = i + tmp.chunkX;
                let z = j + tmp.chunkZ;
                let d = dist(cameraPos.x, cameraPos.z, x * Chunk.width,z * Chunk.depth);
                if(d < inRange){ 
                    let id = World.chunkID(x,z)

                    if(this.chunks[id] && this.chunks[id].isLoaded) continue;
                    if(!this.chunkLoadingQueue[id]){
                        //console.log("loading", x, z, d, "<", inRange);
                        this.chunkLoadingQueue.push({x, z})
                        this.chunkLoadingQueue[id] = true;
                    }
                }
            }
        }
        
        
        for(let id in this.chunks){
            let chunk = this.chunks[id];
            let d = dist(cameraPos.x, cameraPos.z, chunk.x * Chunk.width, chunk.y * Chunk.depth);
            if(d > outrange){
                this.unloadChunkMesh(chunk.x, chunk.y);
            }
        }

        
        if((this.tick % 5) == 0){
            for(let i = this.chunkLoadingQueue.length-1; i >= 0; --i){
                let c = this.chunkLoadingQueue[i];
                let d = dist(cameraPos.x, cameraPos.z, c.x * Chunk.width , c.z * Chunk.depth);
                if(d > outrange){
                    delete this.chunkLoadingQueue[World.chunkID(c.x,c.z)];
                    this.chunkLoadingQueue.splice(i, 1);
                }
            }
            for(let i = 0; i < this.chunkPerUpdate; ++i){
                let firstToLoad = this.chunkLoadingQueue.shift();
                if(!firstToLoad) return;
                this.loadChunkMesh(firstToLoad.x, firstToLoad.z);
                delete this.chunkLoadingQueue[World.chunkID(firstToLoad.x,firstToLoad.z)];

                let lastToLoad = this.chunkLoadingQueue.pop();
                if(!lastToLoad) return;
                this.loadChunkMesh(lastToLoad.x, lastToLoad.z);
                delete this.chunkLoadingQueue[World.chunkID(lastToLoad.x,lastToLoad.z)];
            }
        }
    }

    unloadChunkMesh(x, y){

        let chunk = this.chunks[World.chunkID(x, y)];
        if(!chunk) return;
        this.chunks[World.chunkID(x, y)].isLoaded = false;
        let chunkObj = this.world.getObjectByName(chunk.id);
        if(!chunkObj) return;
        ChunkMesh.deleteData(chunkObj, chunk);
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
        if(!chunkObj){
            chunkObj = new THREE.Object3D();
            chunkObj.position.set(x * Chunk.width, 0, y * Chunk.depth);
            chunkObj.name = chunk.id;
            this.world.add(chunkObj);
        }
        if(!chunk.isLoaded){
            let chunkMesh = ChunkMesh.build(chunk, this.materials);
            ChunkMesh.addToObject(chunkObj, chunkMesh, chunk);
        }
        
    }

    getBlock(x, y, z) {
        const pos = World.ToLocalCoord(x, y, z);
        const chunk = this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)];
        if(chunk) return chunk.getBlock(pos.x, pos.y, pos.z);
        return -1;
    }

    updateChunk(chunkObj, chunkData) {
        ChunkMesh.deleteData(chunkObj, chunkData);
        let meshData = ChunkMesh.build(chunkData, this.materials);
        ChunkMesh.addToObject(chunkObj, meshData, chunkData);
    }

    setBlock(blockID, x, y, z, update = true) {
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
