"""
Packs GLSL Shader files into .js files for Khan Academy Support.
"""
import base64
from math import ceil

global filesize_limit
filesize_limit = 19 #MB
filesize_limit_bytes = filesize_limit*1000000

def pack_shaders(path, files):
    """Converts GLSL Shaders into Base64 stings stored in JS files"""
    for filename in files:
        contents = ""
        newFilename = ""
        with open(path+filename, 'r') as f:
            filenameParts = filename.split('.')
            for i in range(len(filenameParts)):
                if filenameParts[i].lower() == "fx": continue
                if i == 0:
                    newFilename+=filenameParts[i]
                else:
                    newFilename+=filenameParts[i].capitalize()
            newFilename+="Shader.js"
            newFilename.replace("Fx", "")
            print("CONVERT:  "+filename+" => "+newFilename)
            contents = f.read()
        
        with open(path+newFilename, 'w') as f:
            output = "window."+newFilename.split('.')[0]+" = `"
            output += contents
            output+="\n`;"
            f.write(output)

# def pack_images(path, images):
#     """Converts images into Base64 stings stored in JS files"""
#     for filename in images:
#         encoded_string = ""
#         with open(path+filename, "rb") as image_file:
#             encoded_string = base64.b64encode(image_file.read())
        
#         base_name = filename.split(".")[0]
#         new_filename = base_name+".js"
#         with open(path+new_filename, "w") as js_file:
#             js_file.write("window."+base_name.replace("-", "")+' = "'+encoded_string.decode()+'";')




def pack_images(path, images):
    """Converts images into Base64 stings stored in JS files"""
    global filesize_limit_bytes
    for filename in images:
        encoded_string = ""
        with open(path+filename, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode()
        
        
        num_files = ceil(len(encoded_string) / filesize_limit_bytes)
        file_index = 0
        while len(encoded_string) > 0:
            base_name = filename.split(".")[0]
            var_name = base_name.replace("-", "")
            new_filename = base_name+str(file_index)+".js" if num_files>1 else base_name+".js"

            cut_index = min(filesize_limit_bytes, len(encoded_string))
            segment = encoded_string[:cut_index]
            encoded_string = encoded_string[cut_index:]

            content = ""
            if file_index == 0: content+="window."+var_name+' = [];\n'
            content+="window."+var_name+'.push("'+segment+'");'


            with open(path+new_filename, "w") as js_file:
                js_file.write(content)
            
            file_index+=1

def pack_models(path, models):
    for filename in models:
        encoded_string = ""
        with open(path+filename, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode()
    
        base_name = filename.split(".")[0]+filename.split(".")[1].capitalize()
        var_name = base_name.replace("-", "")
        new_filename = base_name+".js"
        with open(path+new_filename, "w") as js_file:
            js_file.write("window."+var_name+' = "data:;base64,'+encoded_string+'";')

if __name__ == "__main__":

    shader_path = "src/shaders/"
    shader_files = ["baseVolume.vert", "gi.frag", "dynamicGiHd.fragment.fx", "dynamicGiHd.vertex.fx", "alphaover.fragment.fx", "gen.frag", "scattering.fragment.fx", "debugVoxel.fragment.fx", "debugVoxel.vertex.fx"]

    pack_shaders(shader_path, shader_files)

    image_path = "src/imgs/"
    image_files = ["Rock035_4K-JPG_Color2.jpg", "Rock035_4K-JPG_NormalGL.jpg", "testImg.jpeg"]

    pack_images(image_path, image_files)

    model_path = "src/models/"
    model_files = ["drone1.obj", "drone1.mtl", "drone2.glb"]
    pack_models(model_path, model_files)

