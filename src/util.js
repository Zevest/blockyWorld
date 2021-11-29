function Uint32(val) {
    return Math.trunc(val) & 0xFFFFFFFF;
}
function Uint24(val) {
    return Math.trunc(val) & 0xFFFFFF;
}

function RGBA(r, g, b, a){
    return Uint32(((Math.trunc(a) & 0xFF) | (Math.trunc(b) & 0xFF) << 8 |  (Math.trunc(g) & 0xFF) << 16 ) + ((Math.trunc(r) & 0xFF) << 23) * 2 );
}

function RGB(r, g, b){
    return Uint24(((Math.trunc(b) & 0xFF) | (Math.trunc(g) & 0xFF) << 8 |  (Math.trunc(r) & 0xFF) << 16 ));
}

function Color(r,g,b) {
    switch(arguments.length) {
        case 0:
            return 0;
        case 1:
            if(typeof r == "string"){
                return Uint24(parseInt(r, 16));
            }else{
                return RGB(r, r, r);
            }
        default:
        case 3:
            return RGB(r, g, b);
    }
}

function Color32(r,g,b,a) {
    switch(arguments.length) {
        case 0:
            return 0;
        case 1:
            if(r instanceof String){
                Uint32(parseInt(r, 16));
            }else{
                return RGBA(r, r, r, 0xFF);
            }
        case 2:

            return RGBA(r, r, r, g);
        case 3:
            return RGBA(r, g, b, 0xFF);
        default:
        case 4:
            console.log(RGBA(r, g, b, a));
            return RGBA(r, g, b, a);
    }
}

function clamp(val, min, max) {
    if(val < min) return min;
    if(val > max) return max;
    return val;
}

function dist(x1, y1, x2, y2){
    return Math.sqrt((x2-x1) *(x2-x1) + (y2-y1)*(y2-y1));
}

function getClassName(Class) {
    let classDef = `${Class}`;
    let className = classDef.split('{')[0].split(' ')[1].split('(')[0];
    return className;
}