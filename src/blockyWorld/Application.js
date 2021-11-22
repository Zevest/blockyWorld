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
        this.skyLight.name = "SkyLight";
        //this.scene.add(this.skyLight);
        
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.castShadow = true;
        this.sunLight.name = "Sun Light";
        
        this.sunLight.position.x = 20;
        this.sunLight.position.y = 20;
        this.sunLight.position.z = 12;
        //this.scene.add(this.sunLight);
        

        this.ground = new THREE.Mesh(this.planeGeometry, this.materials.default);        
        this.ground.rotateX(-Math.PI /2.0);
        this.ground.name = "Ground";
        this.ground.position.y = -1;
        this.ground.scale.x = 100;
        this.ground.scale.y = 100;
        this.ground.receiveShadow = true;
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
        this.scene.add(this.world.world);

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

    start() {
        //let red  = this.addColorMaterial(255,0,0);
        //let green  = this.addColorMaterial(0,255,0);
        // let blue  = this.addColorMaterial(0,0,255);
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

    update(deltaTime) {
        this.cameraController.Update(deltaTime);
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