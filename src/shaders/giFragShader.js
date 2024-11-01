window.giFragShader = `#version 300 es
precision highp float;
precision mediump sampler3D;

in vec2 position;

out vec4 outColor[6];
// out vec4 gl_FragColor;

uniform sampler3D uDataSampler;

uniform sampler3D uXPFSampler;
uniform sampler3D uYPFSampler;
uniform sampler3D uZPFSampler;
uniform sampler3D uXNFSampler;
uniform sampler3D uYNFSampler;
uniform sampler3D uZNFSampler;


uniform int uIteration;
const vec3 jitter[4] = vec3[4](
    vec3(0.25, 0.25, 0.25),
    vec3(0.75, 0.75, 0.75),
    vec3(0.25, 0.75, 0.25),
    vec3(0.75, 0.25, 0.75)
);

#define DATA_SIZE_X 16
#define DATA_SIZE_Y 16
#define DATA_SIZE_Z 16

#define CONE_SAMPLES 20
#define CONE_RADIUS_SLOPE 2

#define RAY_SAMPLES 20
#define RAY_STEP 1
#define RAY_STEP_GAIN 1.1
#define RAY_RADIUS_SLOPE 1.2

// #define ENV_COLOR vec4(0.0, 0.2, 0.2, 1.0)
#define ENV_COLOR vec4(0.0, 0.0, 0.0, 1.0)


uniform int zLayer;

const vec3 DATA_SIZE = vec3(DATA_SIZE_X, DATA_SIZE_Y, DATA_SIZE_Z);

// const vec3 light = vec3(1., 0.5, 1.);
const vec3 light = vec3(0.8, 0.25, 1.5);

const float rayMax = float(RAY_STEP*CONE_SAMPLES)*pow(float(RAY_STEP_GAIN), float(CONE_SAMPLES));

const vec3 DIRECTIONS[14] = vec3[14](
    vec3(1., 0., 0.),
    vec3(-1., 0., 0.),
    vec3(0., 1., 0.),
    vec3(0., -1., 0.),
    vec3(0., 0., 1.),
    vec3(0., 0., -1.),

    vec3(0.5, 0.5, 0.5),
    vec3(-0.5, -0.5, -0.5),
    vec3(0.5, -0.5, 0.5),
    vec3(-0.5, 0.5, -0.5),
    vec3(0.5, 0.5, -0.5),
    vec3(-0.5, -0.5, 0.5),
    vec3(0.5, -0.5, -0.5),
    vec3(-0.5, 0.5, 0.5)

);


vec4 sampleCell(sampler3D _sampler, vec3 coordinate, float mipLevel){
    vec3 scaledCoordinate = coordinate/DATA_SIZE;
    return texture(_sampler, scaledCoordinate, mipLevel);
}

vec4 sampleCell(sampler3D _sampler, vec3 coordinate){
    return sampleCell(_sampler, coordinate, 0.);
}

float sampleCell(vec3 coordinate, float mipLevel){
    return sampleCell(uDataSampler, coordinate, mipLevel).r;
}
float sampleCell(vec3 coordinate){
    return sampleCell(uDataSampler, coordinate).r;
}

bool inBounds(vec3 coordinate){
    return all(greaterThanEqual(coordinate, vec3(0.))) && all(lessThan(coordinate, DATA_SIZE));
}

vec4 sampleColor(vec3 coordinate, vec3 normal, float mipLevel){
    vec3 _normal = normalize(normal);
    vec4 xpSample = sampleCell(uXPFSampler, coordinate, mipLevel);
    vec4 ypSample = sampleCell(uYPFSampler, coordinate, mipLevel);
    vec4 zpSample = sampleCell(uZPFSampler, coordinate, mipLevel);
    vec4 xnSample = sampleCell(uXNFSampler, coordinate, mipLevel);
    vec4 ynSample = sampleCell(uYNFSampler, coordinate, mipLevel);
    vec4 znSample = sampleCell(uZNFSampler, coordinate, mipLevel);

    vec4 color = vec4(0.);
    // color += xpSample*max(dot(_normal, DIRECTIONS[0]), 0.);
    // color += xnSample*max(dot(_normal, DIRECTIONS[1]), 0.);
    // color += ypSample*max(dot(_normal, DIRECTIONS[2]), 0.);
    // color += ynSample*max(dot(_normal, DIRECTIONS[3]), 0.);
    // color += zpSample*max(dot(_normal, DIRECTIONS[4]), 0.);
    // color += znSample*max(dot(_normal, DIRECTIONS[5]), 0.);
    color += mix(xpSample, xnSample, _normal.x);
    color += mix(ypSample, ynSample, _normal.y);
    color += mix(zpSample, znSample, _normal.z);

    return color;
}

vec4 traceCone(vec3 origin, vec3 direction){

    vec4 cumulativeColor = vec4(0.);
    float percentOccluded = 0.;
    vec3 scanPosition = origin;
    float size = 1.;

    vec4 colorSample = vec4(0.);
    float dataSample = 0.;

    for(int j = 0; j < CONE_SAMPLES; j++){
        float mipSize = (size-1.);
        scanPosition+=direction*(size*size*0.5); //mipSize

        dataSample = sampleCell(scanPosition, mipSize);
        // colorSample = sampleCell(uFeedbackSampler, scanPosition, mipSize);
        colorSample = sampleColor(scanPosition, direction*-1., mipSize);

        cumulativeColor += colorSample*dataSample*(1.-percentOccluded);// /float(j+1)*float(size)*0.5;

        percentOccluded += dataSample*0.8;

        if(!inBounds(scanPosition) || percentOccluded > 1.){
            break;
        }
        size+=0.5;
    }
    cumulativeColor += ENV_COLOR*(1.-min(percentOccluded, 1.));
    return cumulativeColor;
}
float traceRay(vec3 origin, vec3 direction, out float dataVaue, out vec3 hitPosition, out bool hit){

    float dataSample = 0.;
    float hitDistance = 0.;
    float stepScaling = RAY_STEP_GAIN;
    vec3 scanPosition = origin;
    hit = false;
    for(int j = 2; j < RAY_SAMPLES; j++){
        float rayLength = float(j*RAY_STEP)*stepScaling;
        hitDistance = rayLength;

        scanPosition += direction*stepScaling;//vec3(0., j, 0.);
        // scanPosition = origin+direction*rayLength;//vec3(0., j, 0.);
        // scanPosition = origin+vec3(0., j, 0.);
        dataSample = sampleCell(round(scanPosition), rayLength*RAY_RADIUS_SLOPE);
        bool outside = !inBounds(round(scanPosition));
        if(outside){
            hitDistance = rayMax;
            dataVaue = 0.;
            hit = false;
            break;
        }else if(dataSample > 0.5){
            dataVaue = dataSample;
            hit = true;
            hitPosition = scanPosition;
            break;
        }
        stepScaling *= RAY_STEP_GAIN;
    }
    if(!hit){
        dataVaue = 0.;
        hitDistance = rayMax;
    }
    return hitDistance;
}
/*
vec4 traceCones(vec3 origin, vec3 direction){
    int scanSize = 1;
    int mipSize = 1;
    int rayDistance = 1;
    vec3 tangent = cross(direction, vec3(0., 1., 0.));
    vec3 bitangent = cross(direction, tangent);

    int hits = 0.;

    for(int j = 1; j < CONE_SAMPLES; j++){
        vec3 scanPosition = origin+ceil(float(j*RAY_STEP)*direction);
        float dataSample = sampleCell(scanPosition, mipSize);

        for(int x = -scanSize; x < scanSize; x++){
            for(int y = -scanSize; y < scanSize; y++){
                
                vec3 scanOffset = tangent*float(x)+bitangent*float(y);
                vec3 scanOffsetPosition = ceil(scanPosition+scanOffset);
                float scanSample = sampleCell(scanOffsetPosition, mipSize);
                if(scanSample > 0.4){
                    return vec4(scanSample, 0., 0., 1.);
                }
            }
        }
    }
}*/

void main() {
    float dataSample = 0.;
    vec4 layerColor = vec4(0.);
    vec3 hitPosition = vec3(0.);
    vec3 cellPosition = vec3(0.);
    bool hit = false;

    vec4 sampleColor = vec4(0.);

    vec4 colorOutputs[6];
    colorOutputs[0] = vec4(0.);
    colorOutputs[1] = vec4(0.);
    colorOutputs[2] = vec4(0.);
    colorOutputs[3] = vec4(0.);
    colorOutputs[4] = vec4(0.);
    colorOutputs[5] = vec4(0.);

    cellPosition = vec3(position.xy, float(zLayer));
    // coordinate = cellPosition/float(DATA_SIZE);
    // dataSample = texture(uDataSampler, vec3(coordinate));
    // dataSample = sampleCell(cellPosition);

    float hitDistance = traceRay(cellPosition, normalize(light), dataSample, hitPosition, hit);
    
    float normDist = hitDistance/rayMax;
    // layerColor = vec4(vec3(normDist*normDist*2.), 1.);
    layerColor = hit ? vec4(vec3(0.), 1.) : vec4(1.) ;
    // layerColor *= (hit ? sampleCell(uFeedbackSampler, hitPosition) : vec4(1.));
    // layerColor = vec4(0.01, layerColor.g, layerColor.r, 1.);
    
    for(int j = 0; j < 14; j++){
        vec3 direction = normalize(DIRECTIONS[j]);//+jitter[uIteration]*0.2);//DIRECTIONS[j];
        // sampleColor = traceCone(cellPosition, direction);
        // traceRay(cellPosition, direction, dataSample, hitPosition, hit);
        sampleColor = traceCone(cellPosition, direction);

        // sampleColor = sampleCell(uFeedbackSampler, hitPosition);

        layerColor.r += length(sampleColor.rgb)*0.2;
        layerColor.g -= length(sampleColor.rgb)*0.2;

        // sampleColor = vec4(vec3(1.-float(hit)), 1.0);

        for(int d = 0; d < 6; d++){
            colorOutputs[d] += vec4(sampleColor.r)/16.*max(dot(direction, DIRECTIONS[d]), 0.);
            colorOutputs[d].a = 1.;
        }
    }
    for(int d = 0; d < 6; d++){
        traceRay(cellPosition, light, dataSample, hitPosition, hit);
        colorOutputs[d].rgb += vec3((1.-float(hit))*max(dot(light, DIRECTIONS[d]), 0.));
    }
    
    // layerColor = vec4(vec3(hitDistance), 1.);
    // layerColor = vec4(dataSample.xyz, 1.);
    // layerColor = vec4(vec3(dataSample.r*0.5+0.5), 1.);

    // layerColor = texture(uFeedbackSampler, vec3(cellPosition.xy, 0.5));
    // layerColor.a = sampleCell(cellPosition);

    outColor[0] = colorOutputs[0];
    outColor[1] = colorOutputs[1];
    outColor[2] = colorOutputs[2];
    outColor[3] = colorOutputs[3];
    outColor[4] = colorOutputs[4];
    outColor[5] = colorOutputs[5];
    
    
}

`;