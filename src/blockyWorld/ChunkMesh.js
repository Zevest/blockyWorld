class ChunkMesh {
    static crossGeometry = null;
    static createMaterial() {
        
        const materials ={
            texture:null,
            block: {
                opaque: null,
                semi:null,
                transparent:null,
            },
            cross:null
        };
        //var loader = new THREE.TextureLoader();
        materials.texture = new THREE.TextureLoader().load("../../res/image/"+BlockInfo.tileSetInfo.image);
        materials.texture.magFilter = THREE.NearestFilter;
        
        materials.block.opaque = new THREE.MeshPhysicalMaterial(
                {map:materials.texture});
        materials.block.semi = new THREE.MeshBasicMaterial(
            {map:materials.texture, transparent: true});
        materials.block.transparent = new THREE.MeshBasicMaterial(
            {map:materials.texture, transparent: true});
        materials.cross = new THREE.MeshBasicMaterial(
            {map:materials.texture, transparent: true, side:THREE.FrontSide,});

        materials.cross.onBeforeCompile = (shader) => {    
            shader.vertexShader = shader.vertexShader
            .replace("#include <common>",SHADER_COMMON_REPLACE)
            .replace("#include <uv_vertex>", SHADER_UV_VERTEX_REPLACE)
            .replace("#include <begin_vertex>",SHADER_BEGIN_VERTEX_REPLACE);
        }
        return materials;
    }

    static initSharedGeometry() {
        
    }

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
        let op_vert = [], op_index = [], op_uv = []
        let st_vert = [], st_index = [], st_uv = []
        let tr_vert = [], tr_index = [], tr_uv = []
        let cr_pos_instanced = [], cr_uv_instanced = [], cr_dim_instanced = [];
        let cr_vert = [], cr_index = [], cr_uv = []

        createBlock(BlockData.BLOCK_LIST[0],cr_vert, cr_index, [], BLOCK.DIAGONAL, [0,0,0]);
        cr_uv = BlockData.BLOCK_LIST[0].getUVCross(BlockData.BLOCK_LIST[0].face.front);
       

        for(let i = 0; i < Chunk.width; ++i)
            for(let j = 0; j < Chunk.height; ++j)
                for(let k = 0; k < Chunk.depth; ++k){
                    let faces = 0
                    let bIndex = chunkData.getBlock(i, j, k);
                    if(bIndex == -1) continue;
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

        
        let block_opaque_vertices = new Float32Array(op_vert);
        let block_opaque_uvs = new Float32Array(op_uv);

        chunkMeshs.geometry.block.opaque = new THREE.BufferGeometry();
        chunkMeshs.geometry.block.opaque.setAttribute("position",
                new THREE.BufferAttribute(block_opaque_vertices, 3));
        chunkMeshs.geometry.block.opaque.setAttribute("uv",
             new THREE.BufferAttribute(block_opaque_uvs, 2));
        chunkMeshs.geometry.block.opaque.setIndex(op_index);
        chunkMeshs.geometry.block.opaque.computeVertexNormals();

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
        

        let block_transparent_vertices = new Float32Array(tr_vert);
        let block_transparent_uvs = new Float32Array(tr_uv);

        chunkMeshs.geometry.block.transparent = new THREE.BufferGeometry();
        chunkMeshs.geometry.block.transparent.setAttribute("position",
                new THREE.BufferAttribute(block_transparent_vertices, 3));
        chunkMeshs.geometry.block.transparent.setAttribute("uv",
                new THREE.BufferAttribute(block_transparent_uvs, 2));
        chunkMeshs.geometry.block.transparent.setIndex(tr_index);
        chunkMeshs.geometry.block.transparent.computeVertexNormals();
        

    
        let cross_instance_position_offset = new Float32Array(cr_pos_instanced);
        let cross_instance_uvs = new Float32Array(cr_uv_instanced);
        let cross_instance_dim = new Int32Array(cr_dim_instanced);
        let cross_transparent_vertices = new Float32Array(cr_vert);
        let cross_transparent_uvs = new Float32Array(cr_uv);

        chunkMeshs.geometry.cross = new THREE.InstancedBufferGeometry();
        chunkMeshs.geometry.cross.setAttribute("position",
                new THREE.BufferAttribute(cross_transparent_vertices, 3));
        chunkMeshs.geometry.cross.setAttribute("uv", 
                new THREE.BufferAttribute(cross_transparent_uvs, 2));
        chunkMeshs.geometry.cross.setIndex(cr_index);
        
        chunkMeshs.geometry.cross.setAttribute("instancePos", 
                new THREE.InstancedBufferAttribute(cross_instance_position_offset, 3));
        chunkMeshs.geometry.cross.setAttribute("instanceUv", 
                new THREE.InstancedBufferAttribute(cross_instance_uvs, 2));
        chunkMeshs.geometry.cross.setAttribute("instanceDim",
                new THREE.InstancedBufferAttribute(cross_instance_dim, 1));
        chunkMeshs.geometry.cross.computeVertexNormals();
        
        chunkMeshs.mesh.block.opaque = new THREE.Mesh(
                chunkMeshs.geometry.block.opaque,
                materials.block.opaque);
        chunkMeshs.mesh.block.opaque.name = "opaque_block_mesh";
        chunkMeshs.mesh.block.opaque.castShadow = true;
        chunkMeshs.mesh.block.opaque.renderOrder = 4;        


        chunkMeshs.mesh.block.semi = new THREE.Mesh(
                chunkMeshs.geometry.block.semi, materials.block.semi);
        chunkMeshs.mesh.block.semi.name = "semi_transparent_block_mesh";
        chunkMeshs.mesh.block.semi.castShadow = true;
        chunkMeshs.mesh.block.semi.renderOrder = 1;        


        chunkMeshs.mesh.block.transparent = new THREE.Mesh(
                chunkMeshs.geometry.block.transparent, materials.block.transparent);
        chunkMeshs.mesh.block.transparent.name = "transparent_block_mesh";
        chunkMeshs.mesh.block.transparent.castShadow = true;
        chunkMeshs.mesh.block.transparent.renderOrder = 3;


        const INSTANCE_COUNT = cr_uv_instanced.length / 2;
        chunkMeshs.mesh.cross = new THREE.InstancedMesh(
                chunkMeshs.geometry.cross, materials.cross, INSTANCE_COUNT);
        chunkMeshs.mesh.cross.renderOrder = 2;
        
        
        const dummy = new THREE.Object3D();
        for (let i = 0; i < INSTANCE_COUNT; i++) {
            chunkMeshs.mesh.cross.setMatrixAt(i, dummy.matrix)
        }
        chunkMeshs.mesh.cross.name = "transparent_cross_mesh";
        chunkMeshs.mesh.cross.castShadow = true;

        return chunkMeshs;
    }

    static addToObject(object3D, chunkMesh) {
        object3D.add(chunkMesh.mesh.block.opaque);
        object3D.add(chunkMesh.mesh.block.semi);
        object3D.add(chunkMesh.mesh.block.transparent);
        object3D.add(chunkMesh.mesh.cross);
    }
}