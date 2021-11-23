class World {
    static currentWorld;
    static range = 4;
    constructor(name, seed){
        this.name = name;
        this.seed = seed;
        this.chunks = {};
        this.world = new THREE.Object3D();
        this.world.position.set(0.5, 0.5, 0.5);
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
    }

    static chunkID(x, y) {
        return `${x};${y}`;
    }

    generateMeshes(materials) {
        //{}
        for(let id in this.chunks){
            let chunkData = this.chunks[id];
            let meshData = ChunkMesh.build(chunkData, materials);
            let chunkObject = new THREE.Object3D();
            ChunkMesh.addToObject(chunkObject, meshData);
            chunkObject.position.set(chunkData.x * Chunk.width, 0, chunkData.y * Chunk.depth);
            this.world.add(chunkObject);
        }
    }

    getBlock(x, y, z) {
        const pos = World.ToLocalCoord(x, y, z);
        const chunk = this.chunks[World.chunkID(pos[0], pos[1])];
        if(chunk) return chunk.getBlock(pos[2], pos[3], pos[4]);
        return -1;
    }


    static ToLocalCoord(x, y, z) {
        const chunkX = Math.floor(x / Chunk.width);
        const rX = (Chunk.width + (x % Chunk.width)) %Chunk.width;

        const chunkZ = Math.floor(z / Chunk.depth);
        const rZ = (Chunk.depth + (z % Chunk.depth)) % Chunk.depth;
        return [chunkX, chunkZ, rX, y, rZ]
    }
}
