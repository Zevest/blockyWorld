/// Contient une partie des bloc d'un monde
class Chunk {
    static width = 16;
    static height = 256;
    static depth = 16;
    static blockCheck;
    static facesOrder;
    
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = `${x};${y}`;

        // Initialisation d'un chunk avec des block d'air (-1)
        this.blockData = new Array(Chunk.width * Chunk.depth * Chunk.height).fill(-1);
        this.isUpdating = false;
        this.isLoaded = false;
        // Ensemble de meshs du chunk
        this.chunkObj = null;
        if(Chunk.blockCheck == undefined) {
            // Coordonnees des blocs voisins
            Chunk.blockCheck = []
            for(let i = -1; i <2; ++i) {
                for(let j = -1; j < 2; ++j) {
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

    /// Genere un chunk aleatoirement
    generateRandom(blockList) {
        const end = Chunk.width * Chunk.height * Chunk.depth;
        for(let i = 0; i < end; ++i) {
            this.blockData[i] = Math.floor(Math.random() * blockList.length +1) - 1;
        }
    }

    /// Genere un chunk avec un mélange d'alea et de perlin noise
    generateNoise(blockList) {
        for(let i = 0; i < Chunk.width; ++i) {
            for(let k = 0; k < Chunk.depth; ++k) {
                // position dans le chunk
                let posX = this.x + i/Chunk.width; 
                let posZ = this.y + k/Chunk.depth;
                // Samples perlin noise a differentes echelles
                let sample = noise.perlin2(posX, posZ) * 0.01;
                let sample2 = noise.perlin2(posX*0.5, posZ*0.5) * 0.05;
                let sample3 = noise.perlin2(posX*0.2, posZ*0.2)*0.4;
                let sample4 = noise.perlin2(posX*0.1, posZ*0.1)*0.2;
                let mult = noise.perlin2(posX*0.1+0.1, posZ*0.1+0.1);
                
                // Calcule de la hauteur du terrain
                let height = Math.min(128, Math.max(30, Chunk.height/ 2)) + Math.floor(2 *(sample + sample2 +  sample3 + sample4 * mult)*(Chunk.height / 4));
                
                this.setBlock(blockList[13].id, i, 0, k); // Bedrock
                // Remplissage de la colone (posX, posZ) de bloc de pierre
                for(let j = 1; j < height-4; ++j) { this.setBlock(blockList[0].id, i, j, k)}
                // Ajout de trois couche de bloc de terre ou de neige en fonction de la hauteur
                for(let j = height-4; j < height; ++j) {
                    if(j > 128) this.setBlock(blockList[48].id, i, j, k)
                    else this.setBlock(blockList[1].id, i, j, k)
                };
                
                if(height > 128) {
                    // Ajout d'une couche de bloc d'herbe recouverte de neige
                    this.setBlock(blockList[49].id, i, height, k);
                } else if(height > 100) {
                    // Ajout de fleur ou de d'herbe
                    let vege = noise.perlin2(posX*0.33548 + 0.2, posZ*0.45168 + 0.2);
                    
                    if(Math.abs(vege) < 0.05) {
                        if(Math.floor(Math.random() * 50) < 2)
                            this.setBlock(blockList[44].id, i, height+1, k);
                    } else if(vege < 0.1) {
                        let p = Math.floor(Math.random() * 50)
                        switch(p) {
                            case 0:
                                this.setBlock(blockList[9].id, i, height+1, k);
                            break;
                            
                            case 4:
                                this.setBlock(blockList[10].id, i, height+1, k);
                            break;
                            default:
                                if (Math.random() < 0.3)
                                    this.setBlock(blockList[31].id, i, height+1, k);
                            break;
                        }
                    } else if (Math.abs(vege) < 0.2) {
                        this.setBlock(blockList[31].id, i, height+1, k);
                    }
                    // Ajout d'une couche de bloc d'herbe recouverte de neige
                    this.setBlock(blockList[2].id, i, height, k);
                    
                } else this.setBlock(blockList[14].id, i, height, k); // Couche de bloc sable
                
            }
        }
    }

    /// Met l'id d'un block au coordonee passe dans le chunk si possible
    setBlock(blockID, x, y, z) {
        if(x < 0 || x >= Chunk.width || y < 0 || y >= Chunk.height || z < 0 || z >= Chunk.depth) return;
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        this.blockData[index] = blockID;
    }
    /// Convertit un indice en coordonee tridimensionnel
    static indexToCoord(index) {
        let x = index % Chunk.depth
        let y = Math.floor(index / (Chunk.width*Chunk.depth))
        let z = Math.floor((index/Chunk.width) % Chunk.depth)
        return [x, y, z];
    }
    /// Convertit des coordonnee tridimensionnel en indice
    static coordToIndex(x, y, z) {
        if(z == undefined) {
            y = x[1];
            z = x[2];
            x = x[0];
        }
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        return index;
    }

    /// Recupere le block au coordonne passe en argument
    getBlock(x, y, z) {
        // Peut egalement verifier jusqu'a un bloc hors des limites dans les chunks voisins
        if(x == -1 || x == Chunk.width || z == -1 || z == Chunk.depth) {
            return this.getBlockFromNeighbourChunk(x, y, z);
        }
        if(x < -1 || x >= Chunk.width || y < 0 || y >= Chunk.height || z < -1 || z >= Chunk.depth) return -1;
        let index = x + z * Chunk.width + y * Chunk.width * Chunk.depth;
        return this.blockData[index];
    }
    /// Recupere un block dans un chunk voisin
    getBlockFromNeighbourChunk(x, y, z) {
        let chunkX = this.x, chunkY = this.y, chunkData;
        switch(x) {
            case -1: // Chunk gauche
                chunkData = World.currentWorld.chunks[World.chunkID(--chunkX, chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(Chunk.width-1, y, z)
                
            case Chunk.width: // Chunk droite
                chunkData = World.currentWorld.chunks[World.chunkID(++chunkX, chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(0, y, z)
                
        }
        switch(z) {
            case -1: // Chunk haut/avant
                chunkData = World.currentWorld.chunks[World.chunkID(chunkX, --chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(x, y, Chunk.depth-1)
                
            case Chunk.depth: // Chunk bas/arriere
                chunkData = World.currentWorld.chunks[World.chunkID(chunkX, ++chunkY)];
                if(!chunkData) return -1;
                return chunkData.getBlock(x, y, 0)
                
        }
        /*if(this.x == 0 && this.y == 0) {
            console.log(World.currentWorld.chunks, World.chunkID(chunkX, chunkY));
            console.log(x + chunkX * Chunk.width, y, z + chunkY * Chunk.depth);
        }
        let
        if(chunkData) return chunkData.getBlock(x + chunkX * Chunk.width, y, z + chunkY * Chunk.depth);*/
        return -1; // aucun autre Voisin
    }

    /// Recupere les face visble (expose a l'air) d'un bloc 
    getBlockRenderedFace(x, y, z) {
        let face = 0, blockID, myBlockID = this.getBlock(x, y, z);
        for(let i = 0; i < Chunk.blockCheck.length; ++i) {
            let dir = Chunk.blockCheck[i];
            blockID = this.getBlock(x + dir[0], y + dir[1], z + dir[2]);
            if(blockID < 0 
                || (BlockData.TRANSPARENT_LIST[blockID] && !BlockData.TRANSPARENT_LIST[myBlockID]) 
                || BlockData.CROSS_LIST[blockID]) {
                // Si le bloc ou son voisin est transparent ou de type croix on affiche le bloc
                face |= Chunk.facesOrder[i];
            }
        }
        //if(blockID > -1)
        return face;
        
    }

}