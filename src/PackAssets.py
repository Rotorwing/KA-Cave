"""
Packs GLSL Shader files into .js files for Khan Academy Support.
"""
import base64

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

def pack_images(path, images):
    """Converts images into Base64 stings stored in JS files"""
    for filename in images:
        encoded_string = ""
        with open(path+filename, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read())
        
        base_name = filename.split(".")[0]
        new_filename = base_name+".js"
        with open(path+new_filename, "w") as js_file:
            js_file.write("window."+base_name.replace("-", "")+' = "'+encoded_string.decode()+'";')



# global filesize_limit
# filesize_limit = 10 #MB
# filesize_limit_bytes = filesize_limit*1000000

# def pack_images(path, images):
#     """Converts images into Base64 stings stored in JS files"""
#     global filesize_limit_bytes
#     for filename in images:
#         encoded_string = ""
#         with open(path+filename, "rb") as image_file:
#             encoded_string = base64.b64encode(image_file.read())
        
        
#         num_files = ceil(len(encoded_string) / filesize_limit_bytes)
#         needs_cut = True
#         file_index = 0
#         while needs_cut:
#             base_name = filename.split(".")[0]
#             new_filename = base_name+str(file_index)+".js" if num_files>1 else base_name+".js"

#             cut_index = min(filesize_limit_bytes, len(encoded_string)-1)
#             segment = encoded_string[:cut_index]
#             encoded_string = encoded_string[cut_index:]

#             content = ""
#             if file_index == 0: content+="window."+base_name+' = [];\n'
#             content+="window."+base_name+'.push(")'+segment+


#             with open(path+new_filename, "w") as js_file:
#                 js_file.write("window."+base_name+' = "'+encoded_string.decode().replace("-", "")+'";')
            
#             needs_cut = len(encoded_string) > filesize_limit_bytes
#             file_index+=1

if __name__ == "__main__":

    shader_path = "src/shaders/"
    shader_files = ["baseVolume.vert", "gi.frag", "dynamicGiHd.fragment.fx", "dynamicGiHd.vertex.fx", "alphaover.fragment.fx", "gen.frag", "scattering.fragment.fx", "debugVoxel.fragment.fx", "debugVoxel.vertex.fx"]

    # pack_shaders(shader_path, shader_files)

    image_path = "src/imgs/"
    image_files = ["Rock035_4K-JPG_Color2.jpg", "Rock035_4K-JPG_NormalGL.jpg", "testImg.js"]

    pack_images(image_path, image_files)

