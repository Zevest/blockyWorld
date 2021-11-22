const SHADER_COMMON_REPLACE = "#include <common>\n\
#ifdef USE_INSTANCING\n\
attribute vec3 instancePos;\n\
attribute vec2 instanceUv;\n\
attribute int instanceDim;\n\
float imageWidth = 256.0;\n\
float imageHeight = 256.0;\n\
float tileWidth = 16.0;\n\
float tileHeight = 16.0;\n\
#endif\n";

const SHADER_UV_VERTEX_REPLACE =  "#ifdef USE_UV\n\
#ifdef USE_INSTANCING\n\
    float xMin = float((instanceDim >> 0) & 0xFF);\n\
    float xMax = float((instanceDim >> 8) & 0xFF);\n\
    float yMin = float((instanceDim >> 16) & 0xFF);\n\
    float yMax = float((instanceDim >> 24) & 0xFF);\n\
    float xMinUV = xMin / imageWidth;\n\
    float xMaxUV = (tileWidth - xMax) / imageWidth;\n\
    float yMaxUV = (tileHeight - yMax) / imageHeight;\n\
    if((uv*imageHeight).y > 0.5){\n\
        if((uv*imageWidth).x > 0.5)\n\
            vUv = (uvTransform * vec3(uv + instanceUv - vec2(xMinUV, yMaxUV), 1)).xy;\n\
        else\n\
            vUv = (uvTransform * vec3(uv + instanceUv + vec2(xMaxUV, -yMaxUV), 1)).xy;\n\
    }else{\n\
        if((uv*imageWidth).x > 0.5)\n\
            vUv = (uvTransform * vec3(uv + instanceUv - vec2(xMinUV, 0), 1)).xy;\n\
        else\n\
            vUv = (uvTransform * vec3(uv + instanceUv + vec2(xMaxUV, 0), 1)).xy;\n\
    }\n\
#else\n\
    vUv = (uvTransform * vec3(uv, 1)).xy;\n\
#endif\n\
#endif\n";


const SHADER_BEGIN_VERTEX_REPLACE = "   float sizeX = (xMax - xMin) / tileWidth;\n\
    float sizeY = (yMax - yMin) / tileHeight;\n\
    vec3 transformed = vec3( position.x * sizeX,\
        position.y * sizeY - (1.0 - yMax / tileHeight)/2.0,\
        position.z *sizeX ) + instancePos;"
