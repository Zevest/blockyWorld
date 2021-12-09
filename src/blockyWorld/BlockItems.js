/// Cree le Mesh pour le sprites d'un bloc
function BlockMesh(material, blockData) {
    let pos = [], index = [], uv = []
    let face = BLOCK.FRONT;
    let mat = material.block.opaque;
    // Determination du materiau et des faces necessaire
    if(!BlockData.CROSS_LIST[blockData.id]) {
        face |= BLOCK.RIGHT | BLOCK.TOP;
        if(BlockData.TRANSPARENT_LIST[blockData.id])
            mat = material.block.transparent;
        else if(!BlockData.TRANSPARENT_LIST[blockData.id])
            mat = material.block.semi;
    }
    else mat = material.cross;
        
    createBlock(blockData, pos, index, uv, face);
    // Creation de la Geometry
    let posFloat32Array = new Float32Array(pos);
    let uvFloat32Array = new Float32Array(uv);
    let geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position",
        new THREE.BufferAttribute(posFloat32Array, 3));
    geometry.setAttribute("uv", 
            new THREE.BufferAttribute(uvFloat32Array, 2));
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    let mesh = new THREE.Mesh(geometry, mat);
    mesh.name = blockData.name;
    return mesh;
}
/// Cree le Meshs de tous blocs
function createBlocksItem(material) {
    let meshes = [];
    for(b of BlockData.BLOCK_LIST) {
        meshes.push(BlockMesh(material, b));
    }
    return meshes;
}
/// Creation de la scene pour le rendu des sprites des blocs
function initBlockAtlas(parent, itemPerRow, spriteSize, materials) {
    const ITEM_PER_ROW = itemPerRow;
    let obj = {
        camera: new THREE.OrthographicCamera(),
        scene: null, 
        meshs: null,
        ambient: null, 
        point:null,
        url:null,
        column: itemPerRow,
        row: 0,
        count: 0,
        width: 0,
        height: 0,
        sheight: 0,
        swidth: 0
    }
    parent.renderer.setClearColor(Color(0, 0, 0), 1.0);

    obj.meshs = createBlocksItem(materials);
    const ITEM_PER_COL = Math.ceil(obj.meshs.length / ITEM_PER_ROW);
    obj.row = ITEM_PER_COL;
    obj.count = obj.meshs.length;

    // Calcule de dimension
    const SPACEX = 1.5;
    const SPACEY = 1.65;  
    const UNITX = spriteSize/2
    const UNITY = spriteSize/2
    const RWIDTH = Math.sqrt((SPACEX *-UNITX)**2 + (SPACEX *UNITX)**2);
    obj.swidth = UNITX * SPACEX;
    obj.sheight = UNITY * SPACEY;
    obj.width  = obj.swidth * ITEM_PER_ROW * SPACEX;
    obj.height =  obj.sheight * ITEM_PER_COL * SPACEY;

    // Redimention du canvas
    parent.updateCameraView(obj.width, obj.height);

    obj.camera.left =  parent.canvas.width / - 2;
    obj.camera.right =  parent.canvas.width / 2;
    obj.camera.top = parent.canvas.height / 2;
    obj.camera.bottom = parent.canvas.height /  -2;
    obj.camera.near = 1;
    obj.camera.far = 1000;

    obj.camera.aspect = window.innerWidth / window.innerHeight;
    obj.camera.updateProjectionMatrix();

    let startX = obj.camera.left + (UNITX/2) * SPACEX;
    let startY = obj.camera.top  - (UNITY/2) * SPACEY;

    obj.ambient = new THREE.AmbientLight(Color(170));
    obj.point1 = new THREE.PointLight(Color(255), 0.6);
    obj.point1.decay = 0;
    obj.point1.position.set(0, startY + UNITY*8, 0);

    obj.point2 = new THREE.PointLight(Color(255), 0.2);
    obj.point2.decay = 0;
    obj.point2.position.set(startX - UNITX*7, 0, 0);

    obj.scene = new THREE.Scene();
    obj.scene.add(obj.point1);
    obj.scene.add(obj.point2);
    obj.scene.add(obj.ambient);
    obj.scene.add(obj.camera);
     
    // Calcule des positions des blocs
    for(let i = 0; i< obj.meshs.length; ++i) {
        obj.meshs[i].position.set(
            startX + (i % ITEM_PER_ROW) * UNITX * SPACEX,
            startY - Math.floor(i / ITEM_PER_ROW) * UNITY * SPACEY,
            -spriteSize
        );
        obj.meshs[i].scale.set(RWIDTH/2,UNITY, RWIDTH/2);
        if(BlockData.CROSS_LIST[i]) {
        }
        else {
            obj.meshs[i].rotateX(Math.PI/6);
            obj.meshs[i].rotateY(-Math.PI/4);
        }
        obj.scene.add(obj.meshs[i]);      
    }
   
    return obj;
}

/// Liberation de la memoire occupe par la scene de rendu des sprites de bloc
function deleteBlockData(obj) {
    for(let blockMesh of obj.meshs) {
        obj.scene.remove(blockMesh);
        blockMesh.geometry.dispose();
    }
    obj.meshs.splice(0, obj.meshs.length);
    obj.scene.remove(obj.point1);
    obj.scene.remove(obj.point2);
    obj.scene.remove(obj.ambient);
    obj.scene.remove(obj.camera);
    delete obj.point1;
    delete obj.point2;
    delete obj.ambient;
    delete obj.camera;
    delete obj.scene;
    delete obj.meshs;
}

