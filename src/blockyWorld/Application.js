
class Application {
    static ColPrefix() {
        return "Col_";
    }
    static TargetFrameRate = 500
    static stats = Stats();
    static gui;


    constructor() {
        // setting up container
        this.canvas = window.document.createElement("canvas");
        this.canvas.id = "container";
        this.canvas2D = document.createElement("canvas");
        this.canvas2D.id = "2D";
        this.ctx = this.canvas2D.getContext("2d");


        //console.log(this.ctx);
        //console.log(this.canvas.style.cursor);
        Input.Init(this.canvas, this.TargetFrameRate);
        this.clock = new THREE.Clock();

        this.scene = new THREE.Scene();
        this.rayCaster = new THREE.Raycaster();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 1, 4);


        this.camera.matrixAutoUpdate = false;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setClearColor(0xbfd1e5);
        this.renderer.shadowMap.enabled = true;
        this.resizeViewPort();
        

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener("resize", () => this.resizeViewPort());

        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.planeGeometry = new THREE.PlaneGeometry(1, 1);


        this.currentBlock = 0;
        this.hits = [];
    }

    resizeViewPort() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth - 25, window.innerHeight - 25);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.canvas2D.width = window.innerWidth - 25;
        this.canvas2D.height = window.innerHeight - 25;
        this.camera.updateProjectionMatrix();
        this.ctx.strokeRect(2.5, 2.5, this.canvas2D.width - 4, this.canvas2D.height - 4);
        if (this.screen) {
            this.screen.scale.x = window.innerWidth / 2 / window.innerHeight;
            this.screen.scale.y = 0.5;
        }
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
        this.materials.default = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
        this.materials.blue = new THREE.MeshPhysicalMaterial({color: 0xe0e0e0, transparent: true, opacity: 0.5});
        this.materials.blue.color.r = 0.4;
        this.materials.blue.color.g = 0.7;


        this.materials.chunk = ChunkMesh.createMaterial();
        this.materials.screen2DTexture = new THREE.Texture(this.canvas2D);
        this.materials.BlockOutlineTexture = new THREE.Texture(this.canvas2D);
        this.materials.BlockOutlineTexture.magFilter = THREE.NearestFilter;
        this.materials.BlockOutlineTexture.needsUpdate = true;

        //this.materials.screen2DTexture.needsUpdate = true;
        this.materials.screen2DTexture.magFilter = THREE.NearestFilter;
        this.materials.screen2D = new THREE.MeshBasicMaterial({
            map: this.materials.screen2DTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        this.materials.BlockOutlineTexture.magFilter = THREE.NearestFilter;
        this.materials.BlockOutline = new THREE.MeshBasicMaterial({
            map: this.materials.BlockOutlineTexture,
            transparent: true,
        });
        this.addColorMaterial(1, 1, 1);
    }

    initScene() {


        this.skyLight = new THREE.HemisphereLight(0xbfd1e5, 0x000000, 0.4);
        //this.skyLight.position.set(new THREE.Vector3(0, 0, 0));
        this.skyLight.name = "SkyLight";

        this.scene.add(this.skyLight);
        this.scene.add(new THREE.HemisphereLightHelper(this.skyLight, 50));

        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.75);
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

        this.ground = new THREE.Mesh(this.planeGeometry, this.materials.blue);
        this.ground.rotateX(-Math.PI / 2.0);
        this.ground.name = "Ground";
        this.ground.position.y = 100.8;
        this.ground.scale.x = World.range * 2 * 16;
        this.ground.scale.y = World.range * 2 * 16;
        this.ground.receiveShadow = true;

        this.axes = new THREE.AxesHelper(100);
        this.axes.position.y = 120;
        this.scene.add(this.axes);
        this.scene.add(new THREE.GridHelper(100, 100));



        this.BoxHelper2 = new THREE.Mesh(this.boxGeometry, this.materials.BlockOutline);
        this.BoxHelper2.scale.set(1.01, 1.01, 1.01);
        this.BoxHelper2.renderOrder = 100;
        this.scene.add(this.BoxHelper2);

        this.screen = new THREE.Mesh(this.planeGeometry, this.materials.screen2D);

        this.screen.renderOrder = 101;
        //this.screen.overdraw = true;

        this.screen.name = "screen";
        this.camera.add(this.screen);
        this.scene.add(this.camera);
        this.screen.position.z = -.3;

        this.world = new World("Hello", 1561);
        this.world.initWorld();
        this.world.generateWorld();
        this.world.generateMeshes(this.materials.chunk);
        //this.world.world.position.y = -15;
        this.scene.add(this.world.world);
        //this.scene.add(new THREE.BoxHelper(this.world.world, 0x55ff6a));

        //this.addStaticBoxRigidBody(this.ground, 0);
        this.sunLight.target = this.ground;
        this.scene.add(this.ground);

    }

    getColorMaterial(r, g, b, a) {
        let matName;
        switch (arguments.length) {
            case 1:
                matName = Application.ColPrefix() + Uint32(r);
                break;
            default:
                matName = Application.ColPrefix() + Color(r, g, b, a);
                break;
        }
        return this.materials[matName];

    }

    addColorMaterial(r, g, b) {
        let color = 0;
        switch (arguments.length) {
            case 1:
                color = Uint24(r);
                break;
            default:
                color = Color(r, g, b);
                break;
        }

        let matName = Application.ColPrefix() + color;
        if (this.materials[matName] == undefined) {

            this.materials[matName] = new THREE.MeshStandardMaterial({ color });
        }
        return this.materials[matName];
    }

    initScreen() {

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
        Input.onMouseDown = (button) => {
            if (!Input.hasMouseLock) return;

            if (this.hits.length) {
                let hitpos = this.hits[0].point;
                switch (button) {
                    case Input.M_LEFT:
                        {
                            if (hitpos.distance <= 0.8) break;

                            World.currentWorld.setBlock(-1, hitpos.x, hitpos.y, hitpos.z, false);
                            this.chunkHasChanged = true;
                            let blockID = World.currentWorld.getBlock(hitpos.x, hitpos.y + 1, hitpos.z);
                            let block = BlockData.BLOCK_LIST[blockID]
                            if (block && block.block.type == BlockData.BLOCK_TYPE[3]) {
                                World.currentWorld.setBlock(-1, hitpos.x, hitpos.y + 1, hitpos.z, false);
                            }
                            break;
                        }
                    case Input.M_MIDDLE:
                        {
                            let block = World.currentWorld.getBlock(hitpos.x, hitpos.y, hitpos.z);
                            this.currentBlock = block;
                            console.log(block);
                            break;
                        }
                    case Input.M_RIGHT:
                        {
                            hitpos.addScaledVector(this.hits[0].face.normal, 0.9);
                            World.currentWorld.setBlock(this.currentBlock, hitpos.x, hitpos.y, hitpos.z, false);
                            this.chunkHasChanged = true;
                            break;
                        }
                }
            }


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
        
        Application.gui = new dat.GUI();

        document.body.appendChild(Application.stats.dom);

        const cameraFolder = Application.gui.addFolder("Camera");
        cameraFolder.add(this.camera.position, "x", -128, 144.0).step(0.1).listen();
        cameraFolder.add(this.camera.position, "y", 0, Chunk.height + 2).step(0.1).listen();
        cameraFolder.add(this.camera.position, "z", -128, 144.0).step(0.1).listen();
        cameraFolder.open();
        this.canvas2D.width = 400;
        this.canvas2D.height = 400;
        // Initialisation de la texture pour le selecteur de bloc
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.fillStyle = "white";
        this.ctx.clearRect(1, 1, this.canvas2D.width - 2, this.canvas2D.height - 2);
        this.renderer.render(this.scene, this.camera);

        this.resizeViewPort()
        this.mainLoop();
    }


    rayCast(){    
        this.rayCaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const chunksID = World.currentWorld.getNearbyChunk(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        let chunksObjs = []
        chunksID.forEach((id) => chunksObjs.push(World.currentWorld.world.getObjectByName(id)));
        let hitPos;
        if (chunksObjs.length > 0) {
            this.hits.splice(0, this.hits.length);
            for (let i = chunksObjs.length - 1; i >= 0; --i) {
                if (chunksObjs[i] && chunksObjs[i].userData.isLoaded) {
                    let tmp = this.rayCaster.intersectObject(chunksObjs[i], true);
                    this.hits = tmp.concat(this.hits);
                } else {
                    chunksObjs[i] = undefined;
                }

            }
            if (this.hits.length > 0 && this.hits[0].distance < 4) {

                hitPos = this.hits[0].point;
                // this.BoxHelper.position.set(hitPos.x, hitPos.y, hitPos.z);
                hitPos.addScaledVector(this.hits[0].face.normal, -0.5);
                this.BoxHelper2.position.set(Math.floor(hitPos.x) + 0.5, Math.floor(hitPos.y) + 0.5, Math.floor(hitPos.z) + 0.5);
            } else {
                //this.BoxHelper.position.set(0, -100, 0);
                this.BoxHelper2.position.set(0, -100, 0);
                this.hits.splice(0, this.hits.length);
            }
        }
        return hitPos;
    }


    update(deltaTime) {
        this.cameraController.Update(deltaTime);
        this.sunLight.position.copy(this.camera.position);
        this.sunLight.target = this.world.world;
        this.sunLight.position.y += 20;


        this.ground.position.set(this.camera.position.x, this.ground.position.y, this.camera.position.z);
        let tmp = World.ToLocalCoord(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        let inRange = {};
        for(let j = -World.range; j <= World.range; ++j) {
            for(let i = -World.range; i <= World.range; ++i){
                inRange[World.chunkID(tmp.chunkX+i, tmp.chunkZ + j)] ={x:i + tmp.chunkX, y:j + tmp.chunkZ};
            }
        }
        for(let id in this.world.chunks){
            let chunk = this.world.chunks[id];
            if(inRange[World.chunkID(chunk.x, chunk.y)])
                inRange[World.chunkID(chunk.x, chunk.y)] = {x: chunk.x, y: chunk.y};
        }
        for(let id in inRange){
            let pos = inRange[id];
            this.d = dist(pos.x, pos.y, tmp.chunkX + tmp.x / 16, tmp.chunkZ + tmp.z / 16);
            let cObj = this.world.world.getObjectByName(id);
            if(this.d <= World.range){
                //if(this.world.chunks[id].)
                //console.log("if", this.d, World.range, tmp.chunkX, tmp.chunkZ, pos.x, pos.y);
                
                this.world.loadChunkMesh(pos.x, pos.y);
                //if(cObj) cObj.position.y = 0;
            }else if (this.d > World.range){                //console.log("else if", this.d, World.range, tmp.chunkX, tmp.chunkZ, pos.x, pos.y);
                //debugger;
                if(cObj)
                    this.world.unloadChunkMesh(pos.x, pos.y);
                
                
            }
            //console.log(d);
            
        }
        //console.log(tmp, inRange);
        //console.log(inRange);
        //debugger;

        let hitPos = this.rayCast();

        if (this.chunkHasChanged && hitPos) {
            let updatedChunkID = World.currentWorld.getNearbyChunk(hitPos.x, hitPos.y, hitPos.z, 1, false);
            let chunkToUpdate = []
            updatedChunkID.forEach((id) => chunkToUpdate.push(World.currentWorld.world.getObjectByName(id)));
            chunkToUpdate.forEach((obj) => {
                this.world.updateChunk(obj, this.world.chunks[obj.name]);
                obj.needsUpdate = true;
            });
            this.chunkHasChanged = false;
        }
    }

    draw() {
        //this.ctx.fillStyle = "white";
        //this.ctx.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.fillStyle = "white";

        let unit = Math.min(Math.max(1000, Math.max(this.canvas2D.width, this.canvas2D.height)), 1200);
        let wm = unit / 300;
        let w = unit / 100/* * this.camera.aspect*/;
        let hm = unit / 300;
        let h = unit / 100;
        this.ctx.fillRect(this.canvas2D.width / 2 - w / 2, this.canvas2D.height / 2 - hm / 2, w, hm);
        this.ctx.fillRect(this.canvas2D.width / 2 - wm / 2, this.canvas2D.height / 2 - h / 2, wm, h);
        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(this.canvas2D.width / 2 - w / 2 + 1, this.canvas2D.height / 2 - hm / 2 + 1, w - 2, hm - 2);
        this.ctx.fillRect(this.canvas2D.width / 2 - wm / 2 + 1, this.canvas2D.height / 2 - h / 2 + 1, wm - 2, h - 2);
        //this.ctx.fillStyle  = "red";
        //this.cameraController.forward()
        //this.screen.position.z -= 5;
        this.materials.screen2DTexture.needsUpdate = true;
        //this.materials.BlockOutlineTexture.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
    }

    mainLoop() {

        let deltaTime = this.clock.getDelta();
        //Application.stats.begin();
        this.update(deltaTime);
        this.draw();
        //Application.stats.end();
        Application.stats.update();
        requestAnimationFrame(() => this.mainLoop());

    }
}