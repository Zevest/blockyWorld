const DEBUG = true;
class Application {
    static ColPrefix() {
        return "Col_";
    }
    static TargetFrameRate = 500


    constructor() {
        // setting up container
        this.canvas = window.document.createElement("canvas");
        this.canvas.id = "container";
        this.canvas2D = document.createElement("canvas");
        this.canvas2D.id = "2D";
        this.ctx = this.canvas2D.getContext("2d");


        Input.Init(this.canvas, this.TargetFrameRate);
        this.clock = new THREE.Clock();
        
        this.scene = new THREE.Scene();
        this.rayCaster = new THREE.Raycaster();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 150, 0);


        this.camera.matrixAutoUpdate = false;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setClearColor(Color(191, 209, 229));
        this.renderer.shadowMap.enabled = true;
        //this.renderer.shadowMap.type = THREE.VSMShadowMap;
        //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.shadowMap.type = THREE.PCFShadowMap
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
        //this.ctx.strokeRect(2.5, 2.5, this.canvas2D.width - 4, this.canvas2D.height - 4);
        if (this.screen) {
            this.screen.scale.x = window.innerWidth / 2 / window.innerHeight;
            this.screen.scale.y = 0.5;
        }
    }

    initMaterials() {

        // Initialisation de la texture pour le selecteur de bloc
        this.canvas2D.width = 400;
        this.canvas2D.height = 400;
        this.ctx.fillStyle = Color(200, 0, 255);
        this.ctx.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.clearRect(1, 1, this.canvas2D.width - 2, this.canvas2D.height - 2);
        const blockOutlineUrl = this.canvas2D.toDataURL("image/png");

        this.materials = {
            default: new THREE.MeshStandardMaterial({color: Color(224)}),
            blue: new THREE.MeshPhysicalMaterial({color: Color(102, 179, 255), transparent: true, opacity: 0.5}),
            chunk: ChunkMesh.createMaterial(),
            BlockOutlineTexture: new THREE.TextureLoader().load(blockOutlineUrl),
            BlockOutline: null,
            screen2DTexture: new THREE.Texture(this.canvas2D),
            screen2D: null,
        };
        
        this.materials.BlockOutlineTexture.magFilter = THREE.NearestFilter;
        this.materials.BlockOutlineTexture.minFilter = THREE.NearestFilter;
        this.materials.BlockOutline = new THREE.MeshBasicMaterial({
            map: this.materials.BlockOutlineTexture,
            transparent: true,
        });

        this.materials.screen2DTexture.magFilter = THREE.NearestFilter;
        this.materials.screen2D = new THREE.MeshBasicMaterial({
            map: this.materials.screen2DTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
    }

    initScene() {


        
        this.skyLight = new THREE.AmbientLight(Color(128));//new THREE.HemisphereLight(0xbfd1e5);
        //this.skyLight.position.set(new THREE.Vector3(0, 0, 0));
        this.skyLight.name = "SkyLight";

        this.scene.add(this.skyLight);
        //this.scene.add(this.skyLight, 50);

       // this.sunLight = new THREE.PointLight(Color(255), 0.5, 0, 2);
        this.sunLight = new THREE.DirectionalLight(Color(255), 0.5);
        this.sunLight.castShadow = true;
        this.sunLight.name = "Sun Light";
        this.sunLight.position.x = 900;
        this.sunLight.position.y = 500;
        this.sunLight.position.z = 700;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.bias
        //this.sunLight.shadow.bias = -0.0005;
        //this.sunLight.shadow.camera.far = 1500;
        //this.frustum = {
        this.sunLight.shadow.camera.near = -1000,
        this.sunLight.shadow.camera.far = 1500,
        this.sunLight.shadow.camera.top = 20,
        this.sunLight.shadow.camera.bottom = -40,
        this.sunLight.shadow.camera.left = -40,
        this.sunLight.shadow.camera.right = 40
        //};


        this.sunLight.target =  new THREE.Object3D();
        this.scene.add(this.sunLight.target);
       
        
        this.scene.add(this.sunLight); 
        //this.scene.add(new THREE.DirectionalLightHelper(this.sunLight, 5));
        this.cameraHelper = new THREE.CameraHelper(this.sunLight.shadow.camera);
        this.ground = new THREE.Mesh(this.planeGeometry, this.materials.blue);
        this.scene.add(this.cameraHelper);
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


        this.Other = new THREE.Mesh(this.boxGeometry, this.materials.screen2D);
        this.Other.scale.set(3,3,3);

        
        this.BoxHelper2 = new THREE.Mesh(this.boxGeometry, this.materials.BlockOutline);
        this.BoxHelper2.scale.set(1.001, 1.001, 1.001);
        this.BoxHelper2.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z+5);
        this.BoxHelper2.renderOrder = 100;
        this.scene.add(this.BoxHelper2);

        this.screen = new THREE.Mesh(this.planeGeometry, this.materials.screen2D);

        this.screen.renderOrder = 101;

        this.screen.name = "screen";
        this.camera.add(this.screen);
       
        
        this.scene.add(this.camera);
        this.screen.position.z = -.3;

        this.world = new World("Hello", Math.floor(Math.random() * 65000)/*1561*/);
        this.world.initWorld();
        this.world.generateWorld();
        this.world.generateMeshes(this.materials.chunk);

        this.scene.add(this.world.world);

    }

    
    start() {
        Input.onMouseDown = (button) => {
            if (!Input.hasMouseLock) return;

            if (this.hits.length) {
                let hitpos = this.hits[0].point;
                switch (button) {
                    case Input.M_LEFT:
                        {
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
                            let c = new THREE.Vector3();
                            
                            c.add(hitpos).sub(this.camera.position);
                            if(c.length() < 1.9) break;
                            hitpos.addScaledVector(this.hits[0].face.normal, 0.9);
                            World.currentWorld.setBlock(this.currentBlock, hitpos.x, hitpos.y, hitpos.z, false);
                            this.chunkHasChanged = true;
                            break;
                        }
                }
            }
        }
        this.cameraController = addComponent(this.camera, CameraController);

        BlockInfo.initData("../../res/json/block.json", "../../res/json/MinecraftTiles.json",
            "../../res/shader/block_cross_vert.glsl", "../../res/shader/block_cross_frag.glsl",
            () => this.setup());

    }

    setup() {
        this.initMaterials();

        this.initScene();

        if(DEBUG){
            this.gui = new dat.GUI();
            this.stats = Stats();
            document.body.appendChild(this.stats.dom);

            const cameraFolder = this.gui.addFolder("Camera");
            cameraFolder.add(this.camera.position, "x", -500, 500).step(1).listen();
            cameraFolder.add(this.camera.position, "y", 0, Chunk.height *2).step(0.1).listen();
            cameraFolder.add(this.camera.position, "z", -500, 500).step(1).listen();
            cameraFolder.open();

            const BoxHelperFolder = this.gui.addFolder("Box Helper");
            BoxHelperFolder.add(this.sunLight.position, "x").step(0.1).listen();
            BoxHelperFolder.add(this.sunLight.position, "y").step(0.1).listen();
            BoxHelperFolder.add(this.sunLight.position, "z").step(0.1).listen();
            BoxHelperFolder.open();
        }
        
        this.resizeViewPort();
        this.mainLoop();
    }

    rayCast(){    
        this.rayCaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const chunksID = this.world.getNearbyChunk(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        let chunksObjs = []
        chunksID.forEach((id) => chunksObjs.push(this.world.world.getObjectByName(id)));
        let hitPos;
        if (chunksObjs.length > 0) {
            this.hits.splice(0, this.hits.length);
            for (let i = chunksObjs.length - 1; i >= 0; --i) {
                if (chunksObjs[i] && this.world.chunks[chunksID[i]].isLoaded) {
                    let tmp = this.rayCaster.intersectObject(chunksObjs[i], true);
                    this.hits = tmp.concat(this.hits);
                } else {
                    chunksObjs[i] = undefined;
                }

            }
            if (this.hits.length > 0 && this.hits[0].distance < 4) {
                hitPos = this.hits[0].point;
                hitPos.addScaledVector(this.hits[0].face.normal, -0.5);
                this.BoxHelper2.position.set(Math.floor(hitPos.x) + 0.5, Math.floor(hitPos.y) + 0.5, Math.floor(hitPos.z) + 0.5);
            } else {
                this.BoxHelper2.position.set(0, -100, 0);
                this.hits.splice(0, this.hits.length);
            }
        }
        return hitPos;
    }

    update(deltaTime) {
        this.cameraController.Update(deltaTime);        


        this.ground.position.set(this.camera.position.x, this.ground.position.y, this.camera.position.z);
        let tmp = World.ToLocalCoord(this.camera.position.x, this.camera.position.y, this.camera.position.z);

        this.sunLight.target.position.set(tmp.chunkX * Chunk.width + tmp.x, tmp.y, tmp.chunkZ * Chunk.depth + tmp.z);
        //this.sunLight.target.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        this.sunLight.position.y = 800;
        this.sunLight.position.x = this.camera.position.x +300;
        this.sunLight.position.z = this.camera.position.z + 500;
        this.world.update(this.camera.position);



        let hitPos = this.rayCast();
        if(hitPos) this.Other.position.set(hitPos.x, hitPos.y, hitPos.z);
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

    drawScreen() {
                //this.ctx.fillStyle = "white";
        //this.ctx.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        //this.ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.fillStyle = "white";

        let unit = Math.min(Math.max(1000, Math.max(this.canvas2D.width, this.canvas2D.height)), 1200);
        let wm = unit / 300;
        let w = unit / 100/* * this.camera.aspect*/;
        let hm = unit / 300;
        let h = unit / 100;

        //console.log(y);
        this.ctx.fillRect(this.canvas2D.width / 2 - w / 2, this.canvas2D.height / 2 - hm / 2, w, hm);
        this.ctx.fillRect(this.canvas2D.width / 2 - wm / 2, this.canvas2D.height / 2 - h / 2, wm, h);
        this.ctx.fillStyle = "grey";
        this.ctx.fillRect(this.canvas2D.width / 2 - w / 2 + 1, this.canvas2D.height / 2 - hm / 2 + 1, w - 2, hm - 2);
        this.ctx.fillRect(this.canvas2D.width / 2 - wm / 2 + 1, this.canvas2D.height / 2 - h / 2 + 1, wm - 2, h - 2);
        //this.ctx.fillStyle  = "red";
        //
        this.materials.screen2DTexture.needsUpdate = true
    }

    draw() {

        this.drawScreen();
        this.renderer.render(this.scene, this.camera);
    }

    mainLoop() {

        let deltaTime = this.clock.getDelta();
        //Application.stats.begin();
        this.update(deltaTime);
        this.draw();
        //Application.stats.end();
        if(DEBUG) this.stats.update();
        requestAnimationFrame(() => this.mainLoop());

    }
}