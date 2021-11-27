const BLOCK = {
    NONE     : 0b00000000,
    TOP      : 0b00000001,
    FRONT    : 0b00000010,
    LEFT     : 0b00000100,
    RIGHT    : 0b00001000,
    BACK     : 0b00010000,
    BOTTOM   : 0b00100000,
    ALL      : 0b00111111,
    DIAGONAL1: 0b01000000,
    DIAGONAL2: 0b10000000,
    DIAGONAL : 0b11000000,
}

const INDEX_RECT = [0, 1, 2, 1, 3, 2];
const INDEX_CROSS = [
    0, 1, 6, 1, 7, 6,
    4, 5, 2, 5, 3, 2,
    8, 14, 9, 14, 15, 9,
    12, 10, 13, 10, 11, 13
]

function createBlock(blockData, verticesArray, indicesArray, uvs, faces, position = [0, 0, 0]){
    let p = faces;
    let count = 0, mask;
    vertOffset = verticesArray.length, uvOffset = uvs.length;
    if(p == BLOCK.DIAGONAL){
        //mask = BLOCK.DIAGONAL2;
        //for(let i = 0; i < 2; ++i, mask >>=1 ){

            INDEX_CROSS.forEach(v => indicesArray.push(v + (vertOffset / 3)));
            addFace(position, verticesArray, vertOffset, uvs, uvOffset, blockData, BLOCK.DIAGONAL);
            vertOffset += 30;
            uvOffset += 20;
        //}
        //INDEX_RECT.forEach(v => indicesArray.push(v + (vertOffset / 3)));
        //addFace(position, verticesArray, vertOffset, uvs, uvOffset, blockData, BLOCK.DIAGONAL2);
        //vertOffset += 12;
        //uvOffset += 8;
    }
    else{
        if(blockData.block.properties)
        {
            if(blockData.block.properties.showSide){
                p |= BLOCK.FRONT | BLOCK.RIGHT | BLOCK.LEFT | BLOCK.BACK;
            }
            if(blockData.block.properties.showTop){
                p |= BLOCK.TOP;
            }
        }
        faces |= p;
        while(p > 0) {
            count += (p&1);
            p>>=1;
        }
        mask = BLOCK.BOTTOM;
        while(mask) {
            if(faces & mask){
                INDEX_RECT.forEach(v => indicesArray.push(v + (vertOffset / 3)));
                addFace(position, verticesArray, vertOffset, uvs, uvOffset, blockData, mask);
                vertOffset += 12;
                uvOffset += 8;
                
            }
            mask >>=1;
        }
    }
    
}

// top 0 front 1 right left back bottom
function addFace(position, vertices, vertOffset, uvs, uvOffset, blockData, direction) {
    const SIZE = {x: 0.5, y: 0.5, z: 0.5};
    const diagUnit = 0.707106781;
    if(blockData.block.properties){
        const prop = blockData.block.properties;
        

        if(prop.size){
            SIZE.x = prop.size.x / 2;
            SIZE.y = prop.size.y / 2;
            SIZE.z = prop.size.z / 2;
        }
    }
    let tmp = BlockInfo.getTileFromName(blockData.face.front);
    if(tmp.properties){
        const prop = BlockInfo.getPropertyObject(tmp.properties);
        if(prop.pixelWidth){
            //console.log(tmp.type);
            SIZE.x *= prop.pixelWidth / 16;
            SIZE.y *= prop.pixelHeight / 16;
            SIZE.z *= prop.pixelWidth / 16;

        }
    }
    let pos = uvOffset;
    switch(direction){
        case BLOCK.TOP:
            // TOP FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // TOP FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // TOP BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // TOP BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            
            blockData.getUVRect(blockData.face.top).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.FRONT:
            // BOTTOM FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // TOP FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // TOP FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.RIGHT:
            // BOTTOM FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // TOP FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // TOP BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.right).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.LEFT:
            // BOTTOM BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // TOP BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // TOP FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.left).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.BACK:
            // BOTTOM BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // TOP BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // TOP BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.back).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.BOTTOM:
            // BOTTOM BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.bottom).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL1:
            // BOTTOM FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // TOP FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // TOP BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL2:
            // BOTTOM BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // TOP BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // TOP FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL:
            //SIZE.x *= diagUnit;
            //SIZE.z *= diagUnit;
            // TOP FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM FRONT LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]

             // TOP FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM FRONT RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
 
            // TOP BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM BACK LEFT
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            
            // TOP BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM BACK RIGHT
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            
             // TOP FRONT LEFT
             vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
             vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
             vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
             // BOTTOM FRONT LEFT
             vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
 
              // TOP FRONT RIGHT
             vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
             // BOTTOM FRONT RIGHT
             vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
 
             
             // TOP BACK LEFT
             vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
             vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
             vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
             // BOTTOM BACK LEFT
             vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
             
 
             // TOP BACK RIGHT
             vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
             // BOTTOM BACK RIGHT
             vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
             vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]

            //console.log(blockData);
            blockData.getUVCross(blockData.face.front).forEach( v => uvs[pos++] = v);
            
    }

}