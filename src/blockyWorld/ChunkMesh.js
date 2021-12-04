class ChunkMesh {
    static crossGeometry = null;

    /// Cree les materiaux d'un chunk
    static createMaterial() {
        
        const materials = {
            texture:null,
            customDepth: null,
            block: {
                opaque: null,
                semi:null,
                transparent:null,
            },
            cross:null
        };
        materials.texture = new THREE.TextureLoader().load("../../res/image/"+BlockInfo.tileSetInfo.image);
        materials.texture.magFilter = THREE.NearestFilter;
        materials.texture.minFilter = THREE.NearestFilter;
        
        materials.block.opaque = new THREE.MeshStandardMaterial(
                {map:materials.texture});
        materials.block.semi = new THREE.MeshStandardMaterial(
            {map:materials.texture, transparent: true});
        materials.block.transparent = new THREE.MeshStandardMaterial(
            {map:materials.texture, transparent: true,  alphaTest: 1, shadowSide: THREE.DoubleSide});
        materials.cross = new THREE.MeshStandardMaterial(
            {map:materials.texture, transparent: true, alphaTest: 1, shadowSide: THREE.FrontSide});
        
        materials.customDepth = new THREE.MeshDepthMaterial(
            {depthPacking: THREE.RGBADepthPacking, map: materials.texture, // or, alphaMap: myAlphaMap
            alphaTest: 0 });
        
        /// Modification du shader pou prendre en compte les coordonées uv des instances des block de type croix.
        materials.cross.onBeforeCompile = (shader) => {    
            shader.vertexShader = shader.vertexShader
            .replace("#include <common>",SHADER_COMMON_REPLACE)
            .replace("#include <uv_vertex>", SHADER_UV_VERTEX_REPLACE);
        }
        return materials;
    }


    /// Contruit la geometry et les Mesh d'un chunk
    static build(chunkData, materials) {
        const chunkMeshs = {
            geometry:{
                block: {
                    opaque: null,
                    semi:null,
                    transparent:null,
                },
                cross:null
            },
            mesh: {
                block: {
                    opaque: null,
                    semi:null,
                    transparent:null,
                },
                cross:null
            }
        }
        let op_vert = [], op_index = [], op_uv = [] // Sommet d'un bloc Opaque
        let st_vert = [], st_index = [], st_uv = [] // Sommet d'un bloc semi transparent
        let tr_vert = [], tr_index = [], tr_uv = [] // Sommet d'un bloc transparent
        
        let cr_vert = [], cr_index = [], cr_uv = [] // Sommet d'un bloc de typ croix
        // Les bloc de type croix on tous leurs vecteur normal pointant vers le haut pour qu'il soit éclairer uniformement
        let cr_normal = [
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0
        ]
        let cr_pos_instanced = [], cr_uv_instanced = [], cr_dim_instanced = []; // donnée par instance des blocs de type croix

        // une seul geometry est necessaire pour les blocs de type croix puisqu'ils seront instanciés.
        createBlock(BlockData.BLOCK_LIST[0],cr_vert, cr_index, [], BLOCK.DIAGONAL, [0,0,0]);
        cr_uv = BlockData.BLOCK_LIST[0].getUVCross(BlockData.BLOCK_LIST[0].face.front);
        
        

        for(let i = 0; i < Chunk.width; ++i)
            for(let j = 0; j < Chunk.height; ++j)
                for(let k = 0; k < Chunk.depth; ++k){
                    let faces = 0
                    let bIndex = chunkData.getBlock(i, j, k);
                    if(bIndex == -1 || bIndex == undefined) continue;
                    let bdata = BlockData.BLOCK_LIST[bIndex];
                    
                    switch(bdata.block.type){
                        case BlockData.BLOCK_TYPE[0]:
                        {
                            faces = chunkData.getBlockRenderedFace(i, j, k);
                            createBlock(bdata, op_vert, op_index, op_uv, faces, [i, j, k]);
                            break;
                        }
                        case BlockData.BLOCK_TYPE[1]:
                        {
                            faces = chunkData.getBlockRenderedFace(i, j, k);
                            createBlock(bdata, st_vert, st_index, st_uv, faces, [i, j, k]);
                            break;
                        }
                        case BlockData.BLOCK_TYPE[2]:
                        {
                            faces = chunkData.getBlockRenderedFace(i, j, k);
                            createBlock(bdata, tr_vert, tr_index, tr_uv, faces, [i, j, k]);
                            break;
                        }
                        case BlockData.BLOCK_TYPE[3]:
                        {
                            faces = BLOCK.DIAGONAL;
                            cr_pos_instanced.push(i, j, k);
                            let tmp = bdata.getUVRect(bdata.face.front);
                            const prop = BlockInfo.getPropertyObject(BlockInfo.getTileFromName(bdata.face.front).properties);
                            let intDim = ((prop.xMin) & 0xff) | ((prop.xMax) & 0xff) << 8 | ((prop.yMin) & 0xff) << 16 | ((prop.yMax) & 0xff) << 24;
                            cr_dim_instanced.push(intDim);
                            cr_uv_instanced.push(tmp[0], tmp[1]);
                            break;
                        }
                    }
                }

        
        // Creation de la geometry pour les blocs opaque
        let block_opaque_vertices = new Float32Array(op_vert);
        let block_opaque_uvs = new Float32Array(op_uv);

        chunkMeshs.geometry.block.opaque = new THREE.BufferGeometry();
        chunkMeshs.geometry.block.opaque.setAttribute("position",
                new THREE.BufferAttribute(block_opaque_vertices, 3));
        chunkMeshs.geometry.block.opaque.setAttribute("uv",
             new THREE.BufferAttribute(block_opaque_uvs, 2));
        chunkMeshs.geometry.block.opaque.setIndex(op_index);
        chunkMeshs.geometry.block.opaque.computeVertexNormals();
        
        // Creation de la geometry pour les blocs semi transparent
        let block_semi_transparent_vertices = new Float32Array(st_vert);
        let block_semi_transparent_uvs = new Float32Array(st_uv);

        chunkMeshs.geometry.block.semi = new THREE.BufferGeometry();
        chunkMeshs.geometry.block.semi.setAttribute("position",
                new THREE.BufferAttribute(block_semi_transparent_vertices, 3));
        chunkMeshs.geometry.block.semi.setAttribute("uv",
                new THREE.BufferAttribute(block_semi_transparent_uvs, 2));
        chunkMeshs.geometry.block.semi.setIndex(st_index);
        chunkMeshs.geometry.block.semi.computeVertexNormals();
        chunkMeshs.castShadow = true;
        chunkMeshs.receiveShadow = true;
        
        // Creation de la geometry pour les blocs transparent
        let block_transparent_vertices = new Float32Array(tr_vert);
        let block_transparent_uvs = new Float32Array(tr_uv);

        chunkMeshs.geometry.block.transparent = new THREE.BufferGeometry();
        chunkMeshs.geometry.block.transparent.setAttribute("position",
                new THREE.BufferAttribute(block_transparent_vertices, 3));
        chunkMeshs.geometry.block.transparent.setAttribute("uv",
                new THREE.BufferAttribute(block_transparent_uvs, 2));
        chunkMeshs.geometry.block.transparent.setIndex(tr_index);
        chunkMeshs.geometry.block.transparent.computeVertexNormals();
        

        // Creation de la geometry pour les blocs de type croix
        //let cross_instance_position_offset = new Float32Array(cr_pos_instanced);
        let cross_instance_uvs = new Float32Array(cr_uv_instanced);
        
        let cross_instance_dim = new Int32Array(cr_dim_instanced);
        let cross_transparent_vertices = new Float32Array(cr_vert);
        let cross_transparent_uvs = new Float32Array(cr_uv);
        let cross_transparent_normal = new Float32Array(cr_normal);

        chunkMeshs.geometry.cross = new THREE.InstancedBufferGeometry();
        chunkMeshs.geometry.cross.setAttribute("position",
                new THREE.BufferAttribute(cross_transparent_vertices, 3));
        chunkMeshs.geometry.cross.setAttribute("uv", 
                new THREE.BufferAttribute(cross_transparent_uvs, 2));
        chunkMeshs.geometry.cross.setAttribute("normal", 
                new THREE.BufferAttribute(cross_transparent_normal, 3));
        chunkMeshs.geometry.cross.setIndex(cr_index);
        
        //chunkMeshs.geometry.cross.setAttribute("instancePos", 
        //        new THREE.InstancedBufferAttribute(cross_instance_position_offset, 3));
        chunkMeshs.geometry.cross.setAttribute("instanceUv", 
                new THREE.InstancedBufferAttribute(cross_instance_uvs, 2));
        chunkMeshs.geometry.cross.setAttribute("instanceDim",
                new THREE.InstancedBufferAttribute(cross_instance_dim, 1));
        
        // Creation de des Mesh pour chaque geometry

        chunkMeshs.mesh.block.opaque = new THREE.Mesh(
                chunkMeshs.geometry.block.opaque,
                materials.block.opaque);
        chunkMeshs.mesh.block.opaque.name = "opaque_block_mesh";
        chunkMeshs.mesh.block.opaque.castShadow = true;
        chunkMeshs.mesh.block.opaque.receiveShadow = true;
        //chunkMeshs.mesh.block.opaque.renderOrder = 4;        


        chunkMeshs.mesh.block.semi = new THREE.Mesh(
                chunkMeshs.geometry.block.semi, materials.block.semi);
        chunkMeshs.mesh.block.semi.name = "semi_transparent_block_mesh";
        chunkMeshs.mesh.block.semi.castShadow = true;
        chunkMeshs.mesh.block.semi.receiveShadow = true;
        //chunkMeshs.mesh.block.semi.renderOrder = 1;        


        chunkMeshs.mesh.block.transparent = new THREE.Mesh(
                chunkMeshs.geometry.block.transparent, materials.block.transparent);
        chunkMeshs.mesh.block.transparent.customDepthMaterial = materials.customDepth;
        chunkMeshs.mesh.block.transparent.name = "transparent_block_mesh";
        chunkMeshs.mesh.block.transparent.castShadow = true;
        chunkMeshs.mesh.block.transparent.receiveShadow = true;
        //chunkMeshs.mesh.block.transparent.renderOrder = 3;


        const INSTANCE_COUNT = cr_uv_instanced.length / 2;
        chunkMeshs.mesh.cross = new THREE.InstancedMesh(
            chunkMeshs.geometry.cross, materials.cross, INSTANCE_COUNT);
        chunkMeshs.mesh.cross.customDepthMaterial = materials.customDepth;
        chunkMeshs.mesh.cross.name = "transparent_cross_mesh";
        chunkMeshs.mesh.cross.castShadow = true;
        chunkMeshs.mesh.cross.receiveShadow = true;
        //chunkMeshs.mesh.cross.renderOrder = 2;
        
        // On calcule la position et la taille des instances.
        const dummy = new THREE.Object3D();
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            let xMin = (cr_dim_instanced[i] >> 0) & 0xFF;
            let xMax = (cr_dim_instanced[i] >> 8) & 0xFF;
            let yMin = (cr_dim_instanced[i] >> 16) & 0xFF;
            let yMax = (cr_dim_instanced[i] >> 24) & 0xFF;
            let sizeX = (xMax - xMin) /  BlockInfo.tileSetInfo.tilewidth;
            let sizeY = (yMax - yMin) / BlockInfo.tileSetInfo.tileheight;
            let yOffset = (1.0 - yMax /  BlockInfo.tileSetInfo.tileheight)/2.0
            dummy.position.set(cr_pos_instanced[i*3], cr_pos_instanced[i*3+1] - yOffset, cr_pos_instanced[i*3+2]);
            dummy.scale.set(sizeX, sizeY, sizeX);
            dummy.updateMatrix();
            chunkMeshs.mesh.cross.setMatrixAt(i, dummy.matrix)
        }

        return chunkMeshs;
    }

    /// Affect le mesh a son objet3D pour qu'il soit visible dans la scene
    static addToObject(object3D, chunkMesh, chunk) {
        if(!object3D) return;
        object3D.add(chunkMesh.mesh.block.opaque);
        object3D.add(chunkMesh.mesh.block.semi);
        object3D.add(chunkMesh.mesh.block.transparent);
        object3D.add(chunkMesh.mesh.cross);
        chunk.isLoaded = true;
        chunk.chunkObj = object3D;
    }

    /// Supprime le mesh et sa goemetry et les retire de la scene.
    static deleteData(object3D, chunkData) {
        if(!object3D || !chunkData || !chunkData.isLoaded) return;
        for(let i = object3D.children.length-1; i >=  0; --i){
            object3D.children[i].geometry.dispose();
            object3D.remove(object3D.children[i]);
        }
        chunkData.isLoaded = false;
    }
}
