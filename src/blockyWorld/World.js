class World {
    static currentWorld;
    constructor(name, seed){
        this.name = name;
        this.seed = seed;
        this.chunks = {};
        this.world = new THREE.Object3D();
    }

    initWorld() {
        noise.seed(this.seed);
        World.currentWorld = this;
    }

    generateWorld(){
        for(let i = -1; i <= 1; ++i)
            for(let j = -1; j <= 1; ++j){
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
}
