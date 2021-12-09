class World {
    /// Contient les donnees du monde et gere leur generation et/ou affichage
    static currentWorld;

    constructor(name, seed) {
        this.name = name;
        this.seed = seed;
        this.chunks = {};
        this.world = new THREE.Object3D();
        this.world.position.set(0.5, 0.5, 0.5);
        this.materials;
        this.chunkLoadingQueue = [];
        this.tick = 0;
        this.range = 5;
        this.chunkPerUpdate = 1;
        this.tickBeforeUpdate = 5;
        let end = false;
    }

    /// Definie La grain de generation de perlin noise et quelque donnee basique
    initWorld() {
        this.end = false;
        noise.seed(this.seed);
        World.currentWorld = this;
    }

    /// Ajoute dans la file de chunk a charger tous les chunk de dans l'intervalle -range a +range sur les deux axes
    generateWorld() {
        for(let i = -this.range; i <= this.range; ++i)
            for(let j = -this.range; j <= this.range; ++j) {
                this.chunkLoadingQueue.push({x:i,z:j});
                this.chunkLoadingQueue[World.chunkID(i,j)] = true;
            }
    }

    /// Converti des coordonnee en un idee de chunk
    static chunkID(x, y) {
        return `${x};${y}`;
    }

    /// Construit les Meshs de tout les chunks genere
    generateMeshes(materials) {
        this.materials = materials;
        for(let id in this.chunks) {
            let chunkData = this.chunks[id];
            // contruit les Mesh
            let meshData = ChunkMesh.build(chunkData, this.materials);
            let chunkObject = new THREE.Object3D();
            chunkObject.name = World.chunkID(chunkData.x, chunkData.y);
            // Ajoute les mesh a un objet3D
            ChunkMesh.addToObject(chunkObject, meshData, chunkData);
            // Definie la position
            chunkObject.position.set(chunkData.x * Chunk.width, 0, chunkData.y * Chunk.depth);
            // ajoute le chunk a monde
            this.world.add(chunkObject);
        }
    }

    /// Cree un nouveau chunk s'il n'existe pas
    addNewChunk(x, y) {
        // Creation du chunk
        if(this.chunks[World.chunkID(x, y)]) {
            return
        };
        let chunk = new Chunk(x,y);
        this.chunks[chunk.id] = chunk;
        // Generation du chunk
        chunk.generateNoise(BlockData.BLOCK_LIST);
        // Creation des meshs
        let chunkMesh = ChunkMesh.build(chunk, this.materials);
        let chunkObj = new THREE.Object3D();
        chunkObj.name = chunk.id;
        ChunkMesh.addToObject(chunkObj, chunkMesh, chunk);
        chunk.isLoaded = true;
        chunkObj.position.set(x * Chunk.width, 0, y * Chunk.depth);
        this.world.add(chunkObj);
        // Liste de chunk a mettre a jour
        let toUpdate = [
            this.chunks[World.chunkID(x, y+1)],
            this.chunks[World.chunkID(x, y-1)],
            this.chunks[World.chunkID(x+1, y)],
            this.chunks[World.chunkID(x-1, y)]
        ];
        // Reconstuction des meshs des chunks voisin
        for(let cData of toUpdate) {
            if(cData) {
                let obj = cData.chunkObj;//this.world.getObjectByName(cData.id);
                this.updateChunk(obj, cData);
            }        
        }
    }

    /// calcule la distance de la camera et les chunks pour les supprimer ou en ajouter
    update(cameraPos) {
        if(this.end) return;
        ++this.tick;
        // Limite externe avant de supprimer les chunks
        let outrange =  Math.sqrt(Math.pow(Chunk.width * (this.range+1), 2) + Math.pow(Chunk.depth * (this.range+1), 2));
        // Limite interne avant d'ajouter les chunks
        let inRange =  Math.sqrt(Math.pow(Chunk.width * this.range*2, 2) + Math.pow(Chunk.depth * this.range*2, 2));
        // coordonee du chunk le plus proche de la camera et sa position local
        let tmp = World.ToLocalCoord(cameraPos.x, cameraPos.y, cameraPos.z);

        // Ajoute tous les chunks dont la distance est dans l'intervalle dans la File d'attente
        for(let j = -this.range; j <= this.range; ++j) {
            for(let i = -this.range; i <= this.range; ++i) {
                let x = i + tmp.chunkX;
                let z = j + tmp.chunkZ;
                let d = dist(cameraPos.x, cameraPos.z, x * Chunk.width,z * Chunk.depth);
                if(d < inRange) { 
                    let id = World.chunkID(x,z)

                    if(this.chunks[id] && this.chunks[id].isLoaded) continue;
                    if(!this.chunkLoadingQueue[id]) {
                        //console.log("loading", x, z, d, "<", inRange);
                        this.chunkLoadingQueue.push({x, z})
                        this.chunkLoadingQueue[id] = true;
                    }
                }
            }
        }
        
        // Decharge tous les chunks hors limite
        for(let id in this.chunks) {
            let chunk = this.chunks[id];
            let d = dist(cameraPos.x, cameraPos.z, chunk.x * Chunk.width, chunk.y * Chunk.depth);
            if(d > outrange) {
                this.unloadChunkMesh(chunk.x, chunk.y);
            }
        }


        if((this.tick % Math.max(1, this.tickBeforeUpdate)) == 0) {
            // Enleve tous les chunks hors limite de la file d'attente
            for(let i = this.chunkLoadingQueue.length-1; i >= 0; --i) {
                let c = this.chunkLoadingQueue[i];
                let d = dist(cameraPos.x, cameraPos.z, c.x * Chunk.width , c.z * Chunk.depth);
                if(d > outrange) {
                    delete this.chunkLoadingQueue[World.chunkID(c.x,c.z)];
                    this.chunkLoadingQueue.splice(i, 1);
                }
            }
            // Charge N *2 chunk dans la file d'attente
            // avec N le nombre de chunk par mise a jour
            for(let i = 0; i < this.chunkPerUpdate; ++i) {
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

    /// Supprime les Meshs d'un chunk
    unloadChunkMesh(x, y) {

        let chunk = this.chunks[World.chunkID(x, y)];
        if(!chunk) return;
        chunk.isLoaded = false;
        //let chunkObj = this.world.getObjectByName(chunk.id);
        //if(!chunkObj) return;
       
        ChunkMesh.deleteData(chunk.chunkObj, chunk);
        this.world.remove(chunk.chunkObj);
        chunk.chunkObj = null;
    }

    /// Cree les Meshs d'un chunk
    loadChunkMesh(x, y) {
        let chunk = this.chunks[World.chunkID(x, y)];
        // Si le chunk n'existe pas on le cree
        if(!chunk) {
            this.addNewChunk(x,y);
            return;
        }
        let chunkObj = chunk.chunkObj;//this.world.getObjectByName(chunk.id);
        // Si le chunk n'a pas d'objet pour contenir les meshs on le cree
        if(!chunkObj) {
            
            chunkObj = new THREE.Object3D();
            chunkObj.position.set(x * Chunk.width, 0, y * Chunk.depth);
            chunkObj.name = chunk.id;
            this.world.add(chunkObj);
        }
        // Si le chunk n'est pas deja charger on le contruit
        if(!chunk.isLoaded) {
            let chunkMesh = ChunkMesh.build(chunk, this.materials);
            ChunkMesh.addToObject(chunkObj, chunkMesh, chunk);
        }
        
    }

    /// Recupere un block dans le monde 
    getBlock(x, y, z) {
        const pos = World.ToLocalCoord(x, y, z);
        const chunk = this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)];
        if(chunk) return chunk.getBlock(pos.x, pos.y, pos.z);
        return -2;
    }

    /// Reconstruit les Meshs d'un chunk
    updateChunk(chunkObj, chunkData) {
        if(this.end) return;
        // Supprime les meshs existante
        ChunkMesh.deleteData(chunkObj, chunkData);
        // Contruit les meshs
        let meshData = ChunkMesh.build(chunkData, this.materials);
        ChunkMesh.addToObject(chunkObj, meshData, chunkData);
    }

    /// Met un Block a la positoin indiquer
    setBlock(blockID, x, y, z, update = true) {
        const pos = World.ToLocalCoord(x, y, z);
        const cname =World.chunkID(pos.chunkX, pos.chunkZ);
        let chunk = this.chunks[cname];
        if(chunk) {
            chunk.setBlock(blockID, pos.x, pos.y, pos.z);
            // Prevention en cas d'implementation  multi thread
            if(!chunk.isUpdating && update) {
                chunk.isUpdating = true;
                let chunkObj = chunk.chunkObj;//this.world.getObjectByName(cname);
                this.updateChunk(chunkObj, chunk);
                chunk.isUpdating = false;
            }
        }
        
    }

    /// Recupere les chunks voisin dont la distance en bloc avec la position indique est inferieur a un valeur indique
    getNearbyChunk(x, y, z, bdist = 3, diagonal = true) {
        let chunks = [];
        let pos = World.ToLocalCoord(x, y, z);
        // Chunk directement au coordonee
        if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ)]) {
            chunks.push(World.chunkID(pos.chunkX, pos.chunkZ));
        }
        // Permet de savoir quel direction on ete visiter
        let minX = false, maxX = false, minZ = false, maxZ = false;
        // Chunk voisin sur l'axe X
        if(pos.x < bdist) {
            minX = true;
            if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ)]) {
                chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ));
            }
        }else if(pos.x > Chunk.width - bdist  - 1/*(pos.chunkX < 0)*/) {
            maxX = true;
            if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ)]) {
                chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ));
            }
        }
         // Chunk voisin sur l'axe Z
        if(pos.z < bdist) {
            minZ = true;
            if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ-1)]) {
                chunks.push(World.chunkID(pos.chunkX, pos.chunkZ-1));
            }

        }else if(pos.z > Chunk.depth - bdist - 1/*(pos.chunkZ < 0)*/) {
            maxZ = true;
            if(this.chunks[World.chunkID(pos.chunkX, pos.chunkZ+1)]) {
                chunks.push(World.chunkID(pos.chunkX, pos.chunkZ+1));
            }
        }
        // Chunk voisin sur les diagonal
        if(diagonal) {
            if(maxX && maxZ) {
                if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ+1)]) {
                    chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ+1));
                }
            }
            else if(maxX && minZ) {
                if(this.chunks[World.chunkID(pos.chunkX+1, pos.chunkZ-1)]) {
                    chunks.push(World.chunkID(pos.chunkX+1, pos.chunkZ-1));
                }
            }
            else if(minX && minZ) {
                if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ-1)]) {
                    chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ-1));
                }
            }
            else if(minX && maxZ) {
                if(this.chunks[World.chunkID(pos.chunkX-1, pos.chunkZ+1)]) {
                    chunks.push(World.chunkID(pos.chunkX-1, pos.chunkZ+1));
                }
            }
        }
        return chunks;
    }

    /// Convertit un position x,y,z en deux ensemble de coordonee (posiiton du chunk, coordonnees local au chunk)
    static ToLocalCoord(x, y, z) {
        let chunkX = Math.floor(x / Chunk.width);
        let rX = Math.floor((Chunk.width + (x % Chunk.width)) %Chunk.width);
        let chunkZ = Math.floor(z / Chunk.depth);
        let rZ = Math.floor((Chunk.depth + (z % Chunk.depth)) % Chunk.depth);
        return {chunkX, chunkZ, x: rX, y: Math.floor(y), z: rZ}
    }

    /// Supprime tous les chunks et leur Meshs
    cleanUp() {
        this.end = true;
        for(let id in this.chunks) {
            ChunkMesh.deleteData(this.chunks[id].chunkObj, this.chunks[id]);
            this.chunks[id].blockData.splice(0, this.chunks[id].blockData.length);
            delete this.chunks[id];
        }
        delete this.chunks;
    }

}
