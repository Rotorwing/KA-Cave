#version 300 es
precision mediump float;
precision mediump sampler3D;

in vec2 position;

out float outColor[4];
// out vec4 gl_FragColor;

uniform sampler3D uDataSampler;

#define DATA_SIZE_X 16
#define DATA_SIZE_Y 16
#define DATA_SIZE_Z 16


uniform int zLayer;
uniform int uVoxelSize;
uniform int uBirthLimit;
uniform int uDeathLimit;

const vec3 DATA_SIZE = vec3(DATA_SIZE_X, DATA_SIZE_Y, DATA_SIZE_Z);

float sampleCell(vec3 coordinate){
    vec3 scaledCoordinate = coordinate/DATA_SIZE;
    return texture(uDataSampler, scaledCoordinate).r;
}

bool inBounds(vec3 coordinate){
    return all(greaterThanEqual(coordinate, vec3(0.))) && all(lessThan(coordinate, DATA_SIZE));
}

void main() {
    float dataSample = 0.;
    float layerColor = 0.;
    vec3 snappedCellPosition = vec3(0.);
    vec3 cellPosition = vec3(0.);


    int neighbors = 0;

    float layer = 0.;

    
    for(int i = 0; i < 4; i++){
        layer = float(zLayer + i);

        neighbors = 0;
        cellPosition = vec3(position.xy, layer);
        snappedCellPosition = floor(cellPosition/float(uVoxelSize))*float(uVoxelSize);

        for(int j = -1; j <= 1; j++){
            for(int k = -1; k <= 1; k++){
                for(int l = -1; l <= 1; l++){
                    if(j == 0 && k == 0 && l == 0){
                        continue;
                    }
                    vec3 scanPosition = snappedCellPosition+vec3(j, k, l)*float(uVoxelSize);
                    dataSample = sampleCell(scanPosition);
                    bool outside = !inBounds(scanPosition);
                    if(outside){
                        // neighbors++;
                    }else{
                        if(dataSample > 0.5){
                            neighbors++;
                        }
                    }
                }
            }
        }
        float thisSample = sampleCell(snappedCellPosition);
        layerColor = thisSample;

        if(thisSample < 0.5 && neighbors >= uBirthLimit){
            layerColor += float(neighbors-uBirthLimit+1)*0.6;
        }
        if(thisSample > 0.5 && neighbors <= uDeathLimit){
            layerColor -= float(uDeathLimit-neighbors+1)*0.6;
        }
        // if(neighbors <= uDeathLimit){
        //     layerColor = 0.;
        // }
        // layerColor = float(neighbors) / 27.0;
        // layerColor = sampleCell(snappedCellPosition+vec3(0., 0., 1.)*float(uVoxelSize));
        // layerColor += sampleCell(snappedCellPosition+vec3(0., 0., -1.)*float(uVoxelSize));
        // layerColor *= 0.5;
        // layerColor = sampleCell(snappedCellPosition+vec3(0., 0., 30.)*float(uVoxelSize));
        // layerColor = cellPosition.z == 0. ? 1. : 0.;
        // layerColor = thisSample;
        
        switch(i){
            case 0:
                outColor[0] = layerColor;
                break;
            case 1:
                outColor[1] = layerColor;
                break;
            case 2:
                outColor[2] = layerColor;
                break;
            case 3:
                outColor[3] = layerColor;
                break;
        }
    }
    
    
}