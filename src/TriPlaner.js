class TriPlanerPlugin extends BABYLON.MaterialPluginBase{
    constructor(material, name){
        super(material, name, 200);

        this._enable(true);
    }

    // getClassName(){
    //     return "TriPlanerPlugin";
    // }

    // getUniforms() {
    //     return {
    //     }
    // }
    // bindForSubMesh(uniformBuffer, scene, engine, subMesh){
    // }

    getCustomCode(shaderType){
        if(shaderType === "vertex"){
            return {
CUSTOM_VERTEX_DEFINITIONS:`
out vec2 vTextureUVX;
out vec2 vTextureUVY;
out vec2 vTextureUVZ;
out mat3 tangentSpace;
`,
CUSTOM_VERTEX_MAIN_END:`
float tileSize = 5.0;
vTextureUVX = worldPos.zy/tileSize;
vTextureUVY = worldPos.xz/tileSize;
vTextureUVZ = worldPos.xy/tileSize;
vec3 xtan = vec3(0, 0, 1);
vec3 xbin = vec3(0, 1, 0);
vec3 ytan = vec3(1, 0, 0);
vec3 ybin = vec3(0, 0, 1);
vec3 ztan = vec3(1, 0, 0);
vec3 zbin = vec3(0, 1, 0);
vec3 normalizedNormal = normalize(normal);
normalizedNormal *= normalizedNormal;
vec3 worldBinormal = normalize(xbin*normalizedNormal.x+ybin*normalizedNormal.y+zbin*normalizedNormal.z);
vec3 worldTangent = normalize(xtan*normalizedNormal.x+ytan*normalizedNormal.y+ztan*normalizedNormal.z);
worldTangent = normalize((normalWorld*worldTangent).xyz);
worldBinormal = normalize((normalWorld*worldBinormal).xyz);
vec3 worldNormal = normalize((normalWorld*normalize(normal)).xyz);
tangentSpace[0] = worldTangent;
tangentSpace[1] = worldBinormal;
tangentSpace[2] = worldNormal;`
            }
        }else if(shaderType === "fragment"){
            return {
CUSTOM_FRAGMENT_DEFINITIONS:
`
in vec2 vTextureUVX;
in vec2 vTextureUVY;
in vec2 vTextureUVZ;
in mat3 tangentSpace;
vec4 triPlanarSample(sampler2D sampler, vec3 normalTW) {
    vec4 baseColor = texture(sampler, vTextureUVX)*normalTW.x;
    baseColor += texture(sampler, vTextureUVY)*normalTW.y;
    baseColor += texture(sampler, vTextureUVZ)*normalTW.z;
    return baseColor;
}
`,
CUSTOM_FRAGMENT_MAIN_BEGIN:
`vec3 normalTW = tangentSpace[2];
vec4 baseNormal = vec4(0.0, 0.0, 0.0, 1.0);
normalTW *= normalTW;
`,
// "!baseColor\\=texture(<.*>":`
// baseColor = triPlanarSample(diffuseSampler, normalTW);
// `,
// "!texture\\(reflectivitySampler,.*?\\)":`triPlanarSample(reflectivitySampler, normalTW)`,
// "!texture\\(bumpSampler,.*?\\)": `triPlanarSample(bumpSampler, normalTW)`,
// "!texture\\(ambientSampler,.*?\\)": `triPlanarSample(ambientSampler, normalTW)`,
// "!texture\\(emissiveSampler,.*?\\)": `triPlanarSample(emissiveSampler, normalTW)`,

"!texture.*?bumpSampler.*?;":`triPlanarSample(bumpSampler, normalTW).xyz, vBumpInfos.y);`,
"!=texture.*?albedoSampler.*?;": `=triPlanarSample(albedoSampler, normalTW);`,
"!=texture.*?reflectivitySampler.*?;": `=triPlanarSample(reflectivitySampler, normalTW);`,

"!=texture.*?diffuseSampler.*?;": `=triPlanarSample(diffuseSampler, normalTW);`,
"!=cotangent_frame.*?;": `=tangentSpace;`,
"!texture.*?bumpSampler.*?\\);": `triPlanarSample(bumpSampler, normalTW)`,
// "!gi!=texture.*?albedoSampler": `=triPlanarSample(^*albedoSampler, normalTW)`,
// "!\\=texture": `=blurp`,
// "!\\(": "[",



// CUSTOM_FRAGMENT_BEFORE_FRAGCOLOR:
// `finalColor.rgb=normalTW.xyz;`//triPlanarSample(albedoSampler,normalTW);`
// ` finalColor.r = texture(albedoSampler, vTextureUVX)*normalTW.x;
// finalColor.r += texture(albedoSampler, vTextureUVY)*normalTW.y;
// finalColor.r += texture(albedoSampler, vTextureUVZ)*normalTW.z;`
// `finalColor.rg = vTextureUVX*normalTW.x;
// finalColor.rg += vTextureUVY*normalTW.y;
// finalColor.rg += vTextureUVZ*normalTW.z;
// finalColor.b = 0.5;`
// ` finalColor = texture(bumpSampler, vTextureUVX)*normalTW.x;
// finalColor += texture(bumpSampler, vTextureUVY)*normalTW.y;
// finalColor += texture(bumpSampler, vTextureUVZ)*normalTW.z;`

            }
        }
        return null;
    }
}

// baseColor = texture(diffuseSampler, vTextureUVX)*normalTW.x;
// baseColor += texture(diffuseSampler, vTextureUVY)*normalTW.y;
// baseColor += texture(diffuseSampler, vTextureUVZ)*normalTW.z;