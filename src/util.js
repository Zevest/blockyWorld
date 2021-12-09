/// Contructeur pour un entier sur 32 bits
function Uint32(val) {
    return Math.trunc(val) & 0xFFFFFFFF;
}
/// Contructeur pour un entier sur 24 bits
function Uint24(val) {
    return Math.trunc(val) & 0xFFFFFF;
}

/// Convertit quatre entier sur 8 bits en un entier sur 32 bits
function RGBA(r, g, b, a) {
    return Uint32(((Math.trunc(a) & 0xFF) | (Math.trunc(b) & 0xFF) << 8 |  (Math.trunc(g) & 0xFF) << 16 ) + ((Math.trunc(r) & 0xFF) << 23) * 2 );
}

/// Convertit trois entier sur 8 bits en un entier sur 32 bits
function RGB(r, g, b) {
    return Uint24(((Math.trunc(b) & 0xFF) | (Math.trunc(g) & 0xFF) << 8 |  (Math.trunc(r) & 0xFF) << 16 ));
}

/// Convertit une couleur en un entier sur 24 bit
function Color(r,g,b) {
    switch(arguments.length) {
        case 0:
            return 0;
        case 1:
            if(typeof r == "string") {
                return Uint24(parseInt(r, 16));
            }else{
                /// intensite
                return RGB(r, r, r);
            }
        default:
        case 3:
            /// rouge vert blue
            return RGB(r, g, b);
    }
}

/// Convertit une couleur en un entier sur 32 bit
function Color32(r,g,b,a) {
    switch(arguments.length) {
        case 0: 
            return 0;
        case 1:
            if(r instanceof String) {
                Uint32(parseInt(r, 16));
            }else{
                /// intensite
                return RGBA(r, r, r, 0xFF);
            }
        case 2:
            /// intensite et opacite
            return RGBA(r, r, r, g);
        case 3:
            /// rouge vert bleu
            return RGBA(r, g, b, 0xFF);
        default:
        case 4:
            /// rouge vert bleu alpha
            console.log(RGBA(r, g, b, a));
            return RGBA(r, g, b, a);
    }
}

/// Limite un valeur a un interval
function clamp(val, min, max) {
    if(val < min) return min;
    if(val > max) return max;
    return val;
}

/// calcule la distance entre deux point bidimensionnel ou tridimensionnel
function dist(x1, y1, z1, x2, y2, z2) {
    switch(arguments.length) {
        case 4: // point du plan
            return Math.sqrt((z1-x1) *(z1-x1) + (x2-y1)*(x2-y1));
        default:
        case 6: // point de l'espace
            return Math.sqrt((x2-x1) *(x2-x1) + (y2-y1)*(y2-y1) + (z2-z1)*(z2-z1));
    }
}

/// recupere le nom de la class dans une chaine de caractere
function getClassName(Class) {
    let classDef = `${Class}`;
    let className = classDef.split('{')[0].split(' ')[1].split('(')[0];
    return className;
}

/// Interpolation lineaire
function lerp(v, a, b) {
    return a + (b - a) * v;
}

/// Recupere la valeur la plus proche de zero 
function AbsoluteMinSign(a, b) {
    if(Math.abs(a) < Math.abs(b))
        return a;
    return b;
}