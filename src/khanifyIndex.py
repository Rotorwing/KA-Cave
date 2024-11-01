
RELEASE = "1.0.3"

with open("src/index.html", "r") as file:
    content = file.read()
    content = content.replace("/src/", "https://cdn.jsdelivr.net/gh/Rotorwing/ka-cave@"+RELEASE+"/src/")
    print(content)