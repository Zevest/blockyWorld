// Remplit une zone de Block un par un sur l'axe X
function place(blockID, startX, y, z, endX) {
    if(startX >= endX) return;
    World.currentWorld.setBlock(blockID, startX, y, z, false);
    setTimeout(() => place(blockID, startX +1, y, z, endX), 100);
}

// Remplit une zone de Block un par un sur l'axe X et Z
function doublePlace(blockID, startX, endX, y, startZ, endZ) {
    if(startZ >= endZ) return;
    place(blockID, startX, y, startZ, endX);
    setTimeout(() => doublePlace(blockID, startX, endX, y, startZ+1, endZ), 100);
}

// Remplit une zone de Block un par un sur l'axe X Y Z
function TriplePlace(blockID, startX, endX, startY, endY, startZ, endZ) {
    if(startY >= endY) return;
    doublePlace(blockID, startX, endX, startY, startZ, endZ);
    setTimeout(() => TriplePlace(blockID, startX, endX, startY+1, endY, startZ, endZ), (endZ - startZ) * 100);
}

function main() {
    if (WEBGL.isWebGLAvailable()) {
            new Application().start();
    } else {
        const warning = WEBGL.getWebGLErrorMessage();
        let div = document.createElement("div");
        div.id = "container";
        document.body.appendChild(div);
        document.getElementById("container").appendChild(warning);
    }
}
main();