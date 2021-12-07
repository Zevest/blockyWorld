const DEBUG = false;
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
        this.shouldEnd = false;
        this.lightDist = 5000;

        this.dayColor = {r:191, g:209, b:229};
        this.nightColor = {r: 10, g:10, b: 20};
        this.lerpColor = {r:0, g:0, b:0};

        Input.Init(this.canvas, this.TargetFrameRate);
        this.clock = new THREE.Clock();
        this.dayLength = 1200;
        this.time = this.dayLength / 4;
        this.timeScale = 1.0;
       
        this.RenderedScene = 1;
        this.scene = new THREE.Scene();
        this.scene2 = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.camera.position.set(0, 150, 0);
        this.camera.matrixAutoUpdate = false;
        this.rayCaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 5);
        
        

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true});
        this.renderer.setClearColor(Color(191, 209, 229));
        this.renderer.shadowMap.enabled = true;
        //this.renderer.shadowMapCullFace = THREE.CullFaceNone;
        //this.renderer.shadowMap.type = THREE.VSMShadowMap;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        //this.renderer.shadowMap.type = THREE.PCFShadowMap
        

        
        document.body.style.backgroundColor = "#000000";
        window.addEventListener("resize", () => this.resizeViewPort());
        window.addEventListener('beforeunload',  (e)=> this.cleanUp());
        
        this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        this.planeGeometry = new THREE.PlaneGeometry(1, 1);

        
        this.currentBlock = 0;
        this.hotBarStart =0;
        this.selectorPos = 0;
        this.hits = [];

    }

    updateCameraView(width, height){
        this.renderer.setSize(width - 25, height - 25);
        this.camera.aspect = width / height;
        this.canvas2D.width = width - 25;
        this.canvas2D.height = height - 25;

        this.camera.updateProjectionMatrix();
    }

    resizeViewPort() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.updateCameraView(window.innerWidth , window.innerHeight);

    }

    initMaterials() {

        // Initialisation de la texture pour le selecteur de bloc
        this.canvas2D.width = 256;
        this.canvas2D.height = 256;
        this.ctx.fillStyle = "#1F1F1F";//Color(50, 50, 0);
        this.ctx.fillRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        this.ctx.clearRect(1, 1, this.canvas2D.width - 2, this.canvas2D.height - 2);
        const blockOutlineUrl = this.canvas2D.toDataURL("image/png");

        this.materials = {
            default: new THREE.MeshStandardMaterial({color: Color(224)}),
            defaultTex: new THREE.MeshStandardMaterial({
                color: Color(224),
                map: new THREE.TextureLoader().load("../../res/image/"+BlockInfo.tileSetInfo.image)
            }),
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
            alphaTest: 1,
        });

        this.materials.screen2DTexture.magFilter = THREE.NearestFilter;
        this.materials.screen2D = new THREE.MeshBasicMaterial({
            map: this.materials.screen2DTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        
        //this.BlockItemData = initBlockAtlasData()
        initRenderData(this, this.canvas2D, this.ctx, this.materials.chunk);

        
    }

    crossMesh(material){
        let pos = [], index = [], uv = []
        createBlock(BlockData.BLOCK_LIST[0], pos, index, uv, BLOCK.DIAGONAL, [0,0,0]);
        uv.forEach( (v, index) => {uv[index] = v *BlockInfo.tileSetInfo.columns;});
        let posFloat32Array = new Float32Array(pos);
        let uvFloat32Array = new Float32Array(uv);
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position",
            new THREE.BufferAttribute(posFloat32Array, 3));
        geometry.setAttribute("uv", 
                new THREE.BufferAttribute(uvFloat32Array, 2));
        geometry.setIndex(index);
        geometry.computeVertexNormals();
        let mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    initScene() {
        // SCENE 1
        {
            this.skyLight = new THREE.AmbientLight(Color(128)); //new THREE.HemisphereLight(0xbfd1e5);
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
            this.sunLight.shadow.mapSize.width = 4096;
            this.sunLight.shadow.mapSize.height = 4096;
            //this.sunLight.shadow.bias = 0.0001;
            //this.sunLight.shadow.bias = -0.0005;
            //this.sunLight.shadow.camera.far = 1500;
            //this.frustum = {
            this.sunLight.shadow.camera.near = this.lightDist-700,
            this.sunLight.shadow.camera.far = this.lightDist + 300,
            this.sunLight.shadow.camera.top = 20,
            this.sunLight.shadow.camera.bottom = -80,
            this.sunLight.shadow.camera.left = -60,
            this.sunLight.shadow.camera.right = 60
            //};


            this.sunLight.target =  new THREE.Object3D();
            this.scene.add(this.sunLight.target);
        
            
            this.scene.add(this.sunLight); 


            this.world = new World("Hello", Math.floor(Math.random() * 65000)/*1561*/);
            this.world.initWorld();
            this.world.generateWorld();
            this.world.generateMeshes(this.materials.chunk);

            
            this.ground = new THREE.Mesh(this.planeGeometry, this.materials.blue);
            
            this.ground.rotateX(-Math.PI / 2.0);
            this.ground.name = "Ground";
            this.ground.position.y = 100.8;
            this.ground.scale.x = this.world.range * 2 * 16;
            this.ground.scale.y = this.world.range * 2 * 16;
            this.ground.receiveShadow = true;


            this.Other = new THREE.Mesh(this.boxGeometry, this.materials.BlockOutline);//this.crossMesh(this.materials.BlockOutline);
            this.Other.scale.set(0.1,0.1,0.1);
            this.Other.name = "Other";
            this.scene.add(this.Other);

            
            this.BoxHelper2 = new THREE.Mesh(this.boxGeometry, this.materials.BlockOutline);
            this.BoxHelper2.scale.set(1.001, 1.001, 1.001);
            this.BoxHelper2.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z+5);
            this.BoxHelper2.renderOrder = 100;
            this.BoxHelper2.name = "BoxHelper";
            this.scene.add(this.BoxHelper2);

            //this.Box = new THREE.Mesh(this.boxGeometry, this.materials.default);
            
            //this.Box.name = "ColliderTest";
            //this.Box.position.copy(this.camera.position);
            //this.scene.add(this.Box);
            //let collider = addComponent(this.Box, BoxCollider, 0.6, 1.8, 0.6);
            //this.BoxEntity = new Player(this.Box);//Entity.NewEntity(this.Box);
            //this.BoxEntity.addComponent(BoxCollider);

            //this.scene.add(collider.box);
            
            this.screen = new THREE.Mesh(this.planeGeometry, this.materials.screen2D);

            this.screen.renderOrder = 101;

            this.screen.name = "screen";
            this.camera.add(this.screen);
        
            
            this.scene.add(this.camera);
            this.screen.position.z = -.3;

            if(DEBUG){
                this.scene.add(new THREE.DirectionalLightHelper(this.sunLight, 5));
                this.cameraHelper = new THREE.CameraHelper(this.sunLight.shadow.camera);
                this.axes = new THREE.AxesHelper(100);
                this.axes.position.y = 120;
                this.scene.add(this.axes);
                this.scene.add(new THREE.GridHelper(100, 100));
                this.scene.add(this.cameraHelper);
            }
            this.scene.add(this.world.world);
        }

        /// SCENE 2
        
        /*{
            this.secondLight = new THREE.AmbientLight(Color(128));
            this.thirdLight = new THREE.PointLight(Color(255), 0.8);
            
            this.scene2.add(this.thirdLight);
            this.scene2.add(this.secondLight);
            console.log("mats: ", this.materials.chunk);
            this.blockItems = createBlocksItem(this.materials.chunk);
            console.log("blockItems", this.blockItems);
            const ITEM_COL = 16;
            const UNIT =  (this.camera2.right - this.camera2.left) / ITEM_COL * 4;
            console.log("UNIT", UNIT);
            for(let i = 0; i< this.blockItems.length; ++i) {
                
                this.blockItems[i].position.set(((i % ITEM_COL) - ITEM_COL/2) * UNIT * 1.5, (-Math.floor(i / ITEM_COL) * UNIT + UNIT*2) * 1.5, -UNIT);
                this.blockItems[i].scale.set(UNIT, UNIT, UNIT);
                if(BlockData.CROSS_LIST[i]){
                    //this.blockItems[i].rotateY(Math.PI);
                }
                else {
                    this.blockItems[i].rotateX(Math.PI/12);
                    this.blockItems[i].rotateY(Math.PI/4);
                }
            
                //this.blockItems[i].scale.set(16, 16, 16);
                this.scene2.add(this.blockItems[i]);
                
            }
            this.thirdLight.position.set(-UNIT * ITEM_COL  -100, UNIT * 5, 150);
        }*/
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
                        this.setSelectorTo(block);
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

        Input.onMouseWheel = (_, deltaY) => {this.moveSelector(deltaY)}
        this.entity = new Player(this.camera);
        
        BlockInfo.initData("../../res/json/block.json", "../../res/json/MinecraftTiles.json",
            "../../res/shader/block_cross_vert.glsl", "../../res/shader/block_cross_frag.glsl",
            () => this.setup());
    }

    setup() {
        this.renderer.setPixelRatio(window.devicePixelRatio);
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
            //cameraFolder.open();

            const boxHelperFolder = this.gui.addFolder("Box Helper");
            boxHelperFolder.add(this.BoxHelper2.position, "x").step(0.1).listen();
            boxHelperFolder.add(this.BoxHelper2.position, "y").step(0.1).listen();
            boxHelperFolder.add(this.BoxHelper2.position, "z").step(0.1).listen();
            //boxHelperFolder.open();

            const settingsFolder = this.gui.addFolder("Settings");
            settingsFolder.add(this.world, "range", 0, 32).step(1);
            settingsFolder.add(this.world, "chunkPerUpdate", 0, 32).step(1);
            settingsFolder.add(this.world, "tickBeforeUpdate", 1, 32).step(1);
            //settingsFolder.open();
            const timeFolder = this.gui.addFolder("Time");
            timeFolder.add(this, "time").step(0.1).listen();
            timeFolder.add(this, "timeScale", 0, 50).step(0.05);
            //timeFolder.open();
        }
    
        //
        Entity.Start();

        this.mainLoop();
    }

    rayCast(){    
        this.rayCaster.setFromCamera({ x: 0, y: 0 }, this.camera);
        const chunksID = this.world.getNearbyChunk(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        let chunksObjs = []
        chunksID.forEach((id) => chunksObjs.push(this.world.chunks[id].chunkObj));
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
                if( !( Math.abs(this.hits[0].face.normal.x) == 1  
                    || Math.abs(this.hits[0].face.normal.y) == 1 
                    || Math.abs(this.hits[0].face.normal.z) == 1 )){
                        // CROSS geometry
                    let id = this.world.getBlock(Math.floor(hitPos.x) + 0.5, Math.floor(hitPos.y) + 0.5, Math.floor(hitPos.z) + 0.5)
                    if(id > 0){
                    
                    this.tile = BlockInfo.getTileFromName(BlockData.BLOCK_LIST[id].face.front)
                    const prop = BlockInfo.getPropertyObject(this.tile.properties);
                    let sizeX = (prop.xMax - prop.xMin) /  BlockInfo.tileSetInfo.tilewidth * HALF_SQRT_2;
                    let sizeY = (prop.yMax - prop.yMin) / BlockInfo.tileSetInfo.tileheight;
                    let yOffset = (1.0 - prop.yMax /  BlockInfo.tileSetInfo.tileheight)/2.0
                    
                    
                    this.Other.position.set(Math.floor(hitPos.x) + 0.5, Math.floor(hitPos.y) + 0.5 - yOffset, Math.floor(hitPos.z) + 0.5);
                    this.Other.scale.set(sizeX, sizeY, sizeX);
                    }else{
                        this.Other.position.set(0, -100, 0);
                    }
                    
                    this.BoxHelper2.position.set(0, -100, 0);
                }else{
                    hitPos.addScaledVector(this.hits[0].face.normal, -0.5);
                    this.Other.position.set(0, -100, 0);
                    this.BoxHelper2.position.set(Math.floor(hitPos.x) + 0.5, Math.floor(hitPos.y) + 0.5, Math.floor(hitPos.z) + 0.5);
                    
                }
            } else {
                this.BoxHelper2.position.set(0, -100, 0);
                this.Other.position.set(0, -100, 0);
                this.hits.splice(0, this.hits.length);
            }
        }
        return hitPos;
    }

    update(deltaTime) {
        if(this.RenderedScene == 1){
            Entity.Update(deltaTime);
            //console.log(collider);
            if(this.shouldEnd) return;
            this.world.update(this.camera.position);
            let dayTime = (this.time % this.dayLength) / this.dayLength;
            let angle = 2 * Math.PI * dayTime;
            let posX = this.camera.position.x + Math.cos(angle) * this.lightDist;
            let posY = this.camera.position.y + Math.sin(angle) * this.lightDist;
            let posZ = this.camera.position.z + Math.cos(angle) * (this.lightDist / 10.0);
            
            let ligthTime = ((this.time +  1 * this.dayLength/5)% this.dayLength) / this.dayLength;
            let t = clamp(Math.abs(ligthTime-0.5)*2, .2, .8);
            if(t == 0.2) t = 0;
            else if (t == 0.8) t = 1;
            this.lerpColor.r = lerp(t, this.dayColor.r, this.nightColor.r);
            this.lerpColor.g = lerp(t, this.dayColor.g, this.nightColor.g);
            this.lerpColor.b = lerp(t, this.dayColor.b, this.nightColor.b);
            this.renderer.setClearColor(Color(this.lerpColor.r, this.lerpColor.g, this.lerpColor.b));

            let tmp = World.ToLocalCoord(this.camera.position.x, this.camera.position.y, this.camera.position.z);
            this.sunLight.target.position.set(tmp.chunkX * Chunk.width + tmp.x, tmp.y, tmp.chunkZ * Chunk.depth + tmp.z);
            this.sunLight.position.set(posX, posY, posZ);
            
            this.ground.position.set(this.camera.position.x, this.ground.position.y, this.camera.position.z);
            
            let hitPos = this.rayCast();
            //if(hitPos) this.Other.position.set(hitPos.x, hitPos.y, hitPos.z);
            if (this.chunkHasChanged && hitPos) {

                let updatedChunkID = this.world.getNearbyChunk(hitPos.x, hitPos.y, hitPos.z, 1, false);
                let chunkToUpdate = []
                updatedChunkID.forEach((id) => chunkToUpdate.push(this.world.chunks[id].chunkObj));
                chunkToUpdate.forEach((obj) => {
                    this.world.updateChunk(obj, this.world.chunks[obj.name]);
                    obj.needsUpdate = true;
                });
                this.chunkHasChanged = false;
            }
            this.screen.scale.x = window.innerWidth / 2 / window.innerHeight / this.camera.zoom;
            this.screen.scale.y = 0.46 / this.camera.zoom;

            this.time += deltaTime * this.timeScale;
        }
    }

    drawScreen() {
        this.ctx.clearRect(0, 0, this.canvas2D.width, this.canvas2D.height);
        drawCross();
        if(isReady() && renderData.fileLoaded > 0){
            //this.ctx.fillRect(200, 200, this.materials.BlockItemAtlas.width, this.materials.BlockItemAtlas.height);
            //this.ctx.drawImage(this.materials.BlockItemAtlas,200, 200);
            //this.ctx.drawImage(this.materials.BlockItemAtlas, x * w, y * h,  w, h, 200, 200, w, h);
            
            drawHotBar(this.canvas2D.width/2 - 200, this.canvas2D.height - 50, 50);
            for(let i = 0; i < 9; ++i){
                drawBlock((this.hotBarStart + i)%BlockData.BLOCK_LIST.length,
                    this.canvas2D.width/2 - 191 + i * 45.5,
                    this.canvas2D.height - 42.5, 
                    33);
            }
            drawSelector(this.canvas2D.width/2 - 200 + this.selectorPos * 45.5,
                this.canvas2D.height - 51, 52);

        }
        this.materials.screen2DTexture.needsUpdate = true
    }

    draw() {
        if(this.RenderedScene == 1){
            this.drawScreen();
            this.renderer.render(this.scene, this.camera);
        }
    }

    mainLoop() {

        let deltaTime = this.clock.getDelta();
        deltaTime = Math.min(deltaTime, 0.1);
        this.update(deltaTime * this.timeScale);
        this.draw();
        if(DEBUG) this.stats.update();
        if(!this.shouldEnd) requestAnimationFrame(() => this.mainLoop());

    }

    setSelectorTo(block){
        let d1 = block - this.hotBarStart;
        let d2 = (block + BlockData.BLOCK_LIST.length) - this.hotBarStart;
        let d = AbsoluteMinSign(d1, d2);
        if(Math.sign(d) > 0){
            if( Math.abs(d) > 8){
                this.hotBarStart = block - 8;
                this.selectorPos = 8;
            }
            else
                this.selectorPos = d;
        }else{
            if( Math.abs(d) > 8){
                this.hotBarStart = block;
                this.selectorPos = 0;
            }
            else{
                this.hotBarStart += d;
                this.selectorPos=0;
            }
        }
        if(this.hotBarStart < 0) this.hotBarStart += BlockData.BLOCK_LIST.length;
        this.currentBlock = (this.hotBarStart+  this.selectorPos) % BlockData.BLOCK_LIST.length;
    }

    moveSelector(step){
        this.selectorPos += step;
        if(this.selectorPos < 0) {
            this.selectorPos = 0;
            --this.hotBarStart;
            if(this.hotBarStart  < 0)
                this.hotBarStart = BlockData.BLOCK_LIST.length - 1;
        }else if(this.selectorPos > 8) {
            ++this.hotBarStart
            this.selectorPos = 8;
        }
        this.currentBlock = (this.hotBarStart+  this.selectorPos) % BlockData.BLOCK_LIST.length;
    }  

    cleanUp() {
        this.shouldEnd = true;
        //alert("Do you really wanna exit ?");
        this.world.cleanUp();
       
        this.materials.default.dispose();
        this.materials.blue.dispose();
        
        this.materials.BlockOutlineTexture.dispose();
        this.materials.BlockOutline.dispose();
        this.materials.screen2DTexture.dispose();
        this.materials.screen2D.dispose();

        this.scene.remove(this.camera);
        this.scene.remove(this.world.world);
        
        this.materials.chunk.texture.dispose();
        this.materials.chunk.block.opaque.dispose();
        this.materials.chunk.block.semi.dispose();
        this.materials.chunk.block.transparent.dispose();
        this.materials.chunk.cross.dispose();  
    }
}