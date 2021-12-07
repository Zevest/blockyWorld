const renderData = {
    canvas: null,
    context: null,
    blockAtlasData: null,
    widget: null,
    isReady: false,
    blockAtlas: null,
    filePendingCount: 0,
    fileLoaded: 0,
    hotbar: {x:0, y:23, w:182, h:22},
    hotbarSelector: {x:1, y:23, w:23, h:23}
}

function isReady(){
    return renderData.filePendingCount == renderData.fileLoaded;
}

function initRenderData(parent, canvas, context, material){
    renderData.canvas = canvas;
    renderData.context = context;
    canvas.imageSmoothingEnabled = true;
    renderData.blockAtlasData = initBlockAtlas(parent, 8, 128, material);
    setTimeout(() => {
        renderData.blockAtlas = saveScreen(parent);
        renderData.widget = LoadImage("../../res/image/widgets.png");
        parent.resizeViewPort(); 
        document.body.appendChild(parent.renderer.domElement);
        deleteBlockData(renderData.blockAtlasData);
    }, 400);
}

function saveScreen(parent){
    renderData.blockAtlasData.scene
    parent.renderer.preserveDrawingBuffer = true;
    parent.updateCameraView(renderData.blockAtlasData.width, renderData.blockAtlasData.height)
    parent.renderer.setClearColor(Color(0, 0, 0), 0);
    parent.renderer.render(renderData.blockAtlasData.scene,  renderData.blockAtlasData.camera)
    return LoadImage(parent.renderer.domElement.toDataURL("image/png", 1.0));
}

function LoadImage(src){
    let image = new Image();
    ++renderData.filePendingCount;
    image.src = src;
    image.onload = () => {++renderData.fileLoaded;};
    return image;
}

function drawCross(){
    renderData.context.fillStyle = "white";
    let unit = Math.min(Math.max(1000, Math.max(renderData.canvas.width, renderData.canvas.height)), 1200);
    let wm = unit / 300;
    let w = unit / 100;
    let hm = unit / 300;
    let h = unit / 100;
    renderData.context.fillRect(renderData.canvas.width / 2 - w / 2, renderData.canvas.height / 2 - hm / 2, w, hm);
    renderData.context.fillRect(renderData.canvas.width / 2 - wm / 2, renderData.canvas.height / 2 - h / 2, wm, h);
    renderData.context.fillStyle = "grey";
    renderData.context.fillRect(renderData.canvas.width / 2 - w / 2 + 1, renderData.canvas.height / 2 - hm / 2 + 1, w - 2, hm - 2);
    renderData.context.fillRect(renderData.canvas.width / 2 - wm / 2 + 1, renderData.canvas.height / 2 - h / 2 + 1, wm - 2, h - 2);
}

function drawHotBar(x, y, h){
    if(isReady() && renderData.fileLoaded > 0){
        let aspect = renderData.hotbar.w / renderData.hotbar.h;
        renderData.context.drawImage(
            renderData.widget, 0, 0, renderData.hotbar.w, renderData.hotbar.h,
             x, y, h * aspect, h);
        
    }
}

function drawSelector(x, y, w){
    if(isReady() && renderData.fileLoaded > 0){
        renderData.context.drawImage(renderData.widget,
            renderData.hotbarSelector.x, renderData.hotbarSelector.y,
            renderData.hotbarSelector.w, renderData.hotbarSelector.h,
            x, y, w, w);
    }
}

function drawBlock(id, x,y, w){
    
    if(isReady() && renderData.fileLoaded > 0){
        let rx = id % renderData.blockAtlasData.column;
        let ry = Math.floor(id / renderData.blockAtlasData.column);
        let rw = renderData.blockAtlasData.swidth;
        let rh = renderData.blockAtlasData.sheight;
        let aspect = rh / rw;
        if(renderData.blockAtlas != undefined){
            renderData.context.drawImage(renderData.blockAtlas, rx * rw, ry * rh,  rw, rh, x, y, w, w * aspect);
        }
    }
}
