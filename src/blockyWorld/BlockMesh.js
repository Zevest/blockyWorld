// Champ de bit: definie la direction des faces
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

// Indices des triangles d'une face
const INDEX_RECT = [0, 1, 2, 1, 3, 2];
// Indices des triangle d'un bloc de type croix
const INDEX_CROSS = [
    0, 1, 6, 1, 7, 6,
    4, 5, 2, 5, 3, 2,
    8, 14, 9, 14, 15, 9,
    12, 10, 13, 10, 11, 13
]
const HALF_SQRT_2 = 0.7071067811865476;
/// Contruit un bloc en ajoutant un face pour chaque cote demande
function createBlock(blockData, verticesArray, indicesArray, uvs, faces, position = [0, 0, 0]) {
    // flag contenant les faces demandees
    let p = faces;
    let count = 0, mask;
    vertOffset = verticesArray.length, uvOffset = uvs.length;
    // Cas special pour les diagonales, on a deja les indices et la direction
    if(p == BLOCK.DIAGONAL) {
        INDEX_CROSS.forEach(v => indicesArray.push(v + (vertOffset / 3)));
        addFace(position, verticesArray, vertOffset, uvs, uvOffset, blockData, BLOCK.DIAGONAL);
        vertOffset += 30;
        uvOffset += 20;
    }
    else{
        // Certains blocs on des proprietes
        if(blockData.block.properties)
        {
            // Force l'affichage des faces sur les cotes
            if(blockData.block.properties.showSide)
                p |= BLOCK.FRONT | BLOCK.RIGHT | BLOCK.LEFT | BLOCK.BACK;
            // Force l'affichage de la face superieur
            if(blockData.block.properties.showTop)
                p |= BLOCK.TOP;
        }
        
        faces |= p;
        // Compte le combre de face a ajouter
        while(p > 0) {
            count += (p&1);
            p>>=1;
        }

        mask = BLOCK.BOTTOM;
        
        while(mask) {
            // Pour bit a 1 on ajout les position et uv correspondant a la direction de la face ainsi les indices
            if(faces & mask) {
                INDEX_RECT.forEach(v => indicesArray.push(v + (vertOffset / 3)));
                addFace(position, verticesArray, vertOffset, uvs, uvOffset, blockData, mask);
                vertOffset += 12;
                uvOffset += 8;
            }
            mask >>=1;
        }
    }
}

/// Ajoute les position et uv des sommet d'une face dans un vecteur puis
function addFace(position, vertices, vertOffset, uvs, uvOffset, blockData, direction) {
    const SIZE = {x: 0.5, y: 0.5, z: 0.5};
    let out = {x: 1.0, y: 1.0, z: 1.0};
    // Certains blocs peuvent avoir une taille personalise
    if(blockData.block.properties) {
        const prop = blockData.block.properties;
        if(prop.size) {
            //SIZE.x = prop.size.x / 2;
            //SIZE.y = prop.size.y / 2;
            //SIZE.z = prop.size.z / 2;
            out.x = prop.size.x;
            out.y = prop.size.y;
            out.z = prop.size.z;
           // debugger;
        }
    }
    
   
    // Les blocs de type croix on leur taille predefinie
    // Elle correspond au dimension (au pixel pres) de leur sprite.
    /*
    let tmp = BlockInfo.getTileFromName(blockData.face.front);
    if(tmp.properties) {
        const prop = BlockInfo.getPropertyObject(tmp.properties);
       
        if(prop.pixelWidth) {
            SIZE.x *= prop.pixelWidth / 16;
            SIZE.y *= prop.pixelHeight / 16;
            SIZE.z *= prop.pixelWidth / 16;

        }
    }*/
    let pos = uvOffset;
    switch(direction) {
        case BLOCK.TOP:
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            
            blockData.getUVRect(blockData.face.top).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.FRONT:
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3]; 
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.RIGHT:
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.right).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.LEFT:
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.left).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.BACK:
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.back).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.BOTTOM:
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * 1.000 + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * 1.000 + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.bottom).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL1:
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT ARRIERE DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL2:
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z  * out.z + position[(vertOffset-1)%3];
            // HAUT AVANT DROITE
            vertices[vertOffset++] =  SIZE.x  * out.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.y  * out.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] =  SIZE.z  * out.z + position[(vertOffset-1)%3];
            blockData.getUVRect(blockData.face.front).forEach( v => uvs[pos++] = v);
            break;
        case BLOCK.DIAGONAL:
            // Les blocs de type croix sont compose de 4 face
            // 2 Faces croise vers l'avant, visible que d'un sens
            // il faut dont 2 autres faces avec la meme position que les 
            // deux premiere mais dans des directions oppose.
            // On peut obtenir le meme resultat avec precisant
            // side = THREE.DoubleSide durant la creation du materiau
            // mais cela pose des problemes pour le calcule des ombres.

            SIZE.x *= HALF_SQRT_2;
            SIZE.z *= HALF_SQRT_2;
            // Faces avant
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]

             // HAUT AVANT DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
 
            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            
            // HAUT ARRIERE DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
        
            // Faces arriere
            // HAUT AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM AVANT GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]

            // HAUT AVANT DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM AVANT DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.z + position[(vertOffset-1)%3]

            // HAUT ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3];
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3];
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3];
            // BOTTOM ARRIERE GAUCHE
            vertices[vertOffset++] = -SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]

            // HAUT ARRIERE DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]
            // BOTTOM ARRIERE DROITE
            vertices[vertOffset++] = SIZE.x + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.y + position[(vertOffset-1)%3]
            vertices[vertOffset++] = -SIZE.z + position[(vertOffset-1)%3]

            blockData.getUVCross(blockData.face.front).forEach( v => uvs[pos++] = v);
            
    }

}