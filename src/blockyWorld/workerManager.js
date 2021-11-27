const MAX_WORKER_COUNT = navigator.hardwareConcurrency;
class WorkerManager {
    
    static workers = []
    static currentWorker = 0;
    static workerCount = 0;
    static pending = 0;
    static protoInstancedBufferGeometry = null;
    static protoInstancedBufferAttribute = null;
    static protoBufferGeometry = null;
    static protoBufferAttribute = null;

    static initWorkers(count, eventListener, blockInfo, blockData){
        WorkerManager.protoInstancedBufferGeometry = new THREE.InstancedBufferGeometry();
        WorkerManager.protoInstancedBufferAttribute = new THREE.InstancedBufferAttribute();
        WorkerManager.protoBufferGeometry = new THREE.BufferGeometry();
        WorkerManager.protoBufferAttribute = new THREE.BufferAttribute();
        WorkerManager.workerCount = Math.min(count, MAX_WORKER_COUNT);
        if(WorkerManager.workers.length > 0){
            for(let worker of WorkerManager.workers){
                worker.terminate();
            }
        }
        WorkerManager.workers.slice(0, WorkerManager.workers.length);
        if(eventListener == undefined)
            eventListener = (e) => {console.log(e.data)};
        for(let i = 0; i < WorkerManager.workerCount; ++i){
            //console.log("test");
            WorkerManager.workers.push(new Worker('./worker.js', ));
            //console.log("test2");
            WorkerManager.workers[i].addEventListener('message', (e) => {
                eventListener(e);
                --WorkerManager.pending;
                if(WorkerManager.pending == 0 && WorkerManager.done){
                    WorkerManager.done();
                }
            })
            WorkerManager.workers[i].postMessage(Message("init", [blockInfo, blockData]));
            WorkerManager.workers[i].postMessage(Message("seed", 130));
        }
    }

    static buildChunkMesh(world, chunk){
        let NChunk = world.chunks[World.chunkID(chunk.x, chunk.y-1)];
        if(NChunk) NChunk = NChunk.getChunkBorder('s');
        let SChunk = world.chunks[World.chunkID(chunk.x, chunk.y+1)];
        if(SChunk) SChunk = SChunk.getChunkBorder('n');
        let EChunk = world.chunks[World.chunkID(chunk.x-1, chunk.y)];
        if(EChunk) EChunk = EChunk.getChunkBorder('w');
        let WChunk = world.chunks[World.chunkID(chunk.x-1, chunk.y)];
        if(WChunk) WChunk = WChunk.getChunkBorder('e');
        WorkerManager.sendMessage("build", {chunk, borders: {n:NChunk, s:SChunk, e:EChunk, w:WChunk}})
    }

    static sendMessage(message, data, index){
        if(index != undefined && index >= 0 && index < WorkerManager.workerCount)
            WorkerManager.workers[index].postMessage(Message(message, data));
        ++WorkerManager.pending;
        WorkerManager.workers[(WorkerManager.currentWorker++)% WorkerManager.workerCount].postMessage(Message(message, data));
    }


}

function CopyProtoRec(target, src){
    //console.log("copyProto", target, src);
    if(!src) return target;
    if(!src.__proto__) return target;
    target.__proto__ = src.__proto__;
    target.__proto__ = CopyProtoRec(target.__proto__, src.__proto__);
    //console.log("copyProto", target);
    return target;
}

function CopyAttributesProto(target, src){
    for(let attribute in target){
        target[attribute] = CopyProtoRec(target[attribute], src);
    }
    return target;
}

function CopyClassicProto(target){
    target = CopyProtoRec(target, WorkerManager.protoBufferGeometry);
    target.attributes = CopyAttributesProto(target.attributes, WorkerManager.protoBufferAttribute);
    target.index = CopyProtoRec(target.index, WorkerManager.protoBufferAttribute);
    return target
}

function CopyInstancedProto(target) {
    target = CopyProtoRec(target, WorkerManager.protoInstancedBufferGeometry);
    target.attributes = CopyAttributesProto(target.attributes, WorkerManager.protoInstancedBufferAttribute);
    target.index = CopyProtoRec(target.index, WorkerManager.protoBufferAttribute);
    return target
}

function CopyProtoGeometry(geometry){
    //console.log("before", geometry);
    //geometry.cross = CopyProto(geometry.cross, WorkerManager.protoInstancedBufferGeometry);
    //geometry.cross.attributes = CopyAttributesProto(geometry.cross.attributes, WorkerManager.protoInstancedBufferAttribute);
    //geometry.cross.index = CopyProto(geometry.cross.index, WorkerManager.protoBufferAttribute);

    //console.log("after", geometry.cross.__proto__);
    //geometry.block.opaque = CopyProto(geometry.block.opaque, WorkerManager.protoBufferGeometry);
    //geometry.block.opaque.attributes = CopyAttributesProto(geometry.block.opaque.attributes, WorkerManager.protoBufferAttribute);
    //geometry.block.opaque.index =  CopyProto(geometry.block.opaque.index, WorkerManager.protoBufferAttribute);

    //geometry.block.semi = CopyProto(geometry.block.semi, WorkerManager.protoBufferGeometry);
    //geometry.block.semi.attributes = CopyAttributesProto(geometry.block.semi.attributes, WorkerManager.protoBufferAttribute);
    //geometry.block.semi.index =  CopyProto(geometry.block.semi.index, WorkerManager.protoBufferAttribute);

    //geometry.block.transparent = CopyProto(geometry.block.transparent, WorkerManager.protoBufferGeometry);
    //geometry.block.transparent.attributes = CopyAttributesProto(geometry.block.transparent.attributes, WorkerManager.protoBufferAttribute);
    //geometry.block.transparent.index =  CopyProto(geometry.block.transparent.index, WorkerManager.protoBufferAttribute);
    geometry.cross = CopyInstancedProto(geometry.cross);
    geometry.block.opaque = CopyClassicProto(geometry.block.opaque);
    geometry.block.semi = CopyClassicProto(geometry.block.semi);
    geometry.block.transparent = CopyClassicProto(geometry.block.transparent);
    //console.log("done copying proto", geometry);
    return geometry;
}


//TODO fix t.getX undefined
function BlockWorldEventListeners(e) {
    let m = e.data;
    //console.log("blockEventListener");
    switch(m.type){
        case "generate":
            World.currentWorld.setChunk(m.data[0].x, m.data[0].y, m.data[1]);
            //console.log(m.data[0].x, m.data[0].y);
            break;
        case "build":
            //console.log(m.data);
            //console.log("geometry received", m.data.geometry);
            //m.data.geometry =  CopyProtoGeometry(m.data.geometry);
            //m.data.geometry =  CopyProtoGeometry2(m.data.geometry);
            
            
            let meshData = ChunkMesh.MeshFromGeometry(CopyProtoGeometry(m.data.geometry), app.materials.chunk, m.data.instanceCount);
            World.currentWorld.addChunk(meshData)
            //console.log("MeshBuilt", meshData);
            break;
    }
}



function Message(type, data){
    return {
        type,
        data,
    }
}




