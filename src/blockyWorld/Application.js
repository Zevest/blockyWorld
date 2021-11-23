class Application {
    static ColPrefix() {
        return "Col_";
    }
    static TargetFrameRate = 165
    


    constructor(){
        // setting up container
        this.canvas = window.document.createElement("canvas");
        this.canvas.id = "container";
        //console.log(this.canvas.style.cursor);
        Input.Init(this.canvas, this.TargetFrameRate);
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.rayCaster = new THREE.Raycaster();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 1, 4);
        

        this.camera.matrixAutoUpdate = false;

        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas, antialias: true});
        this.renderer.setClearColor(0xbfd1e5);
        this.renderer.shadowMap.enabled = true;
        this.resizeViewPort();
        
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", () => this.resizeViewPort());

        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.planeGeometry = new THREE.PlaneGeometry(1, 1);
        
        
        
        this.timeScale = 1.0;  
        this.pp = 0;
        this.currentBlock = 0;
    }

    resizeViewPort() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth - 25, window.innerHeight - 25);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    initPhysics() {
        /*this.physicsData = {
            collisionConfiguration : new Ammo.btDefaultCollisionConfiguration(),
            dispatcher : undefined,
            overlappingPairCache : new Ammo.btDbvtBroadphase(),
            solver : new Ammo.btSequentialImpulseConstraintSolver(),
            dynamicRigidBodies : [],
            tmpTrans : new Ammo.btTransform()
        };
        this.physicsData.dispatcher = new Ammo.btCollisionDispatcher(this.physicsData.collisionConfiguration);
        this.physicsData.world = new Ammo.btDiscreteDynamicsWorld(
            this.physicsData.dispatcher,
            this.physicsData.overlappingPairCache,
            this.physicsData.solver,
            this.physicsData.collisionConfiguration
        );

        this.physicsData.world.setGravity(new Ammo.btVector3(0, -9.81, 0));
        */
    }

    initMaterials() {
        this.materials = {};
        this.materials.default = new THREE.MeshStandardMaterial({color: 0xe0e0e0});
        this.materials.chunk = ChunkMesh.createMaterial();
        this.addColorMaterial(1, 1, 1);
    }

    initScene() {
        

        this.skyLight = new THREE.HemisphereLight(0xbfd1e5, 0x000000, 0.4);
        //this.skyLight.position.set(new THREE.Vector3(0, 0, 0));
        this.skyLight.name = "SkyLight";
        
        this.scene.add(this.skyLight);
        this.scene.add(new THREE.HemisphereLightHelper(this.skyLight, 50));

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.castShadow = true;
        this.sunLight.name = "Sun Light";
        
        this.sunLight.position.x = 20;
        this.sunLight.position.y = 20;
        this.sunLight.position.z = 12;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048
        this.sunLight.shadow.camera.near = 0.001;
        this.sunLight.shadow.camera.far = 500.0;
        this.scene.add(this.sunLight);
        this.scene.add(new THREE.DirectionalLightHelper(this.sunLight, 5));

        this.ground = new THREE.Mesh(this.planeGeometry, this.materials.default);        
        this.ground.rotateX(-Math.PI /2.0);
        this.ground.name = "Ground";
        this.ground.position.y = -1;
        this.ground.scale.x = 100;
        this.ground.scale.y = 100;
        this.ground.receiveShadow = true;
        this.scene.add( new THREE.AxesHelper(100))
        this.scene.add( new THREE.GridHelper(100, 100));
        /*this.chunk1 = new Chunk(0, 0);
        this.chunk2 = new Chunk(1, 0);
        //this.chunk.generateRandom(BlockData.BLOCK_LIST);
        this.chunk1.generateNoise(BlockData.BLOCK_LIST);
        this.chunk2.generateNoise(BlockData.BLOCK_LIST);
        //this.buildChunkMesh(this.chunk);
        console.log(this.materials);
        this.chunkData1 = ChunkMesh.build(this.chunk1, this.materials.chunk);
        this.chunkData2 = ChunkMesh.build(this.chunk2, this.materials.chunk);
        
        
        let Object3DChunk1 = new THREE.Object3D();
        ChunkMesh.addToObject(Object3DChunk1, this.chunkData1);
        Object3DChunk1.position.set(this.chunk1.x * 16, 0, this.chunk1.y * 16)

        let Object3DChunk2 = new THREE.Object3D();
        ChunkMesh.addToObject(Object3DChunk2, this.chunkData2);
        Object3DChunk2.position.set(this.chunk2.x * 16, 0, this.chunk2.y * 16)

        console.log(Object3DChunk1, Object3DChunk2);
        this.scene.add(Object3DChunk1)
        this.scene.add(Object3DChunk2)*/
        this.world = new World("Hello", 1561);
        this.world.initWorld();
        this.world.generateWorld();
        this.world.generateMeshes(this.materials.chunk);
        //this.world.world.position.y = -15;
        this.scene.add(this.world.world);
        this.scene.add(new THREE.BoxHelper(this.world.world, 0x55ff6a));

        //this.addStaticBoxRigidBody(this.ground, 0);
        this.sunLight.target = this.ground;
        this.scene.add(this.ground);
        //this.scene.add(this.chunkData.mesh.block.opaque);
        //this.scene.add(this.chunkData.mesh.block.semi);
        //this.scene.add(this.chunkData.mesh.block.transparent);
        //this.scene.add(this.chunkData.mesh.cross);
    }

    getColorMaterial(r, g, b, a){
        let matName;
        switch(arguments.length) {
            case 1:
                matName = Application.ColPrefix() + Uint32(r);
                break;
            default:
                matName = Application.ColPrefix() + Color(r,g,b,a);
                break;
        }
        return this.materials[matName];
        
    }

    addColorMaterial(r,g,b) {
        let color = 0;
        switch(arguments.length) {
            case 1:
                color = Uint24(r);
                break;
            default:
                color = Color(r,g,b);
                break;
        }
        
        let matName = Application.ColPrefix() + color;
        if(this.materials[matName] == undefined){

            this.materials[matName] = new THREE.MeshStandardMaterial({color});
        }
        return this.materials[matName];
    }
    /*
    getMaxComponentIndex(vector) {
        let m = vector.x;
        let l = [1, vector.x, vector.y, vector.z];
        for(let i = 1, v = l[i]; i <  l.length; ++i) {
            if(Math.abs(m) > Math.abs(v)){
                m = v;
                l[0] = i;
            }
        }
        return l;
    }
    */
    start() {
        //let red  = this.addColorMaterial(255,0,0);
        //let green  = this.addColorMaterial(0,255,0);
        // let blue  = this.addColorMaterial(0,0,255);
        Input.onClick = (button) => {
            if(!Input.hasMouseLock) return;
            let pos = World.ToLocalCoord(this.camera.position.x, this.camera.position.y, this.camera.position.z);
            //console.log(pos);
            this.rayCaster.setFromCamera({x: 0, y:0}, this.camera);
            
            const chunksID = World.currentWorld.getNearbyChunk(this.camera.position.x, this.camera.position.y, this.camera.position.z);
            let hits = []
            let chunksObjs = []
            chunksID.forEach( (id) => chunksObjs.push(World.currentWorld.world.getObjectByName(id)));
            hits = this.rayCaster.intersectObjects(chunksObjs);

            if(hits.length > 0 && hits[0].distance > 0.8 && hits[0].distance < 5){
                let hitpos = hits[0].point;
                //if(Math.sign(forward[forward[0]]) == Math.sign(normal[normal[0]])) return;
                if(button == 1){
                    hitpos.addScaledVector(hits[0].face.normal, 0.5);
                    World.currentWorld.setBlock(this.currentBlock, hitpos.x, hitpos.y, hitpos.z, false);
                }
                else if(button == 3){
                    hitpos.addScaledVector(hits[0].face.normal, -0.5);
                    World.currentWorld.setBlock(-1, hitpos.x, hitpos.y, hitpos.z, false);
                }
                else if(button == 2) {
                    //hitpos.addScaledVector(hits[0].face.normal, 1.0);
                    let block = World.currentWorld.getBlock(hitpos.x, hitpos.y, hitpos.z);
                    this.currentBlock = block;
                    console.log(block);
                }
                
            }
            
            chunksObjs.forEach((obj) => {
                this.world.updateChunk(obj, this.world.chunks[obj.name]);
            });

            console.log(button);
            /*for(let ids of chunksID){
                let chunkObj = World.currentWorld.world.getObjectByName(ids);
                if(chunkObj){
                    console.log(chunkObj, chunkObj instanceof THREE.Object3D);
                    hits = this.rayCaster.intersectObject(chunkObj);
                }else{
                    console.error("cannot find chunk", ids);
                }
            }*/

            //let hit = 
            //console.log(hit[0].point, hit[0]);
            //World.currentWorld.setBlock(0, hit[0].point.x, hit[0].point.y, hit[0].point.z);
        }
        this.cameraController = addComponent(this.camera, CameraController);
        BlockInfo.initData("../../res/json/block.json", "../../res/json/MinecraftTiles.json", 
        "../../res/shader/block_cross_vert.glsl", "../../res/shader/block_cross_frag.glsl",
        () => this.setup());
    }

    setup() {
        this.initMaterials();
        this.initPhysics();
        this.initScene(); 
        this.mainLoop();
    }
    /*
    0 -> 0
    1 -> 1
    2 -> 2
    3 -> 3
    4 -> 4
    5 -> 5
    6 -> 6
    7 -> 7
    8 -> 8
    9 -> 9
    10 -> 10
    11 -> 11
    12 -> 12
    13 -> 13
    14 -> 14 
    15 -> 15
    16 -> 0
    */

     /*
    -0 -> 15
    -1 -> 14
    -2 -> 13
    -3 -> 12
    -4 -> 11
    -5 -> 10
    -6 -> 9
    -7 -> 8
    -8 -> 7
    -9 -> 6
    -10 -> 5
    -11 -> 4
    -12 -> 3
    -13 -> 2
    -14 -> 1
    -15 -> 0
    -16 -> 15
    */



    update(deltaTime) {
        this.cameraController.Update(deltaTime);
        this.sunLight.position.copy( this.camera.position );
        this.sunLight.target = this.world.world;
        //this.sunLight.target.copy( this.camera.position );
        this.sunLight.position.y += 20;
        //this.characterController.Update(deltaTime);
       // this.physicsData.world.stepSimulation(deltaTime* this.timeScale, 1);
        
        //for(let obj of this.physicsData.dynamicRigidBodies){
        //    let rigidBody = getComponent(obj, RigidBody);
        //    rigidBody.moveKinematic();
            /*const motionState = rigidBody.body.getMotionState();
            if(motionState != undefined) {
                motionState.getWorldTransform(this.physicsData.tmpTrans);
                let pos = this.physicsData.tmpTrans.getOrigin();
                let rotQ = this.physicsData.tmpTrans.getRotation();
                obj.position.set(pos.x(), pos.y(), pos.z());
                obj.quaternion.set(rotQ.x(), rotQ.y(), rotQ.z(), rotQ.w());
            }*/
       // }
    }

    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    mainLoop() {
        let deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(() => this.mainLoop());
    }
}