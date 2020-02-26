from robohash import Robohash
import sys
import time

hash = sys.argv[1]
rh = Robohash(hash)
rh.assemble(roboset='set1')
with open("static/robots/"+hash+"1.png", "wb") as f:
    rh.img.save(f, format="png")
print(1)
rh = Robohash(hash)
rh.assemble(roboset='set2')
with open("static/robots/"+hash+"2.png", "wb") as f:
    rh.img.save(f, format="png")
rh = Robohash(hash)
rh.assemble(roboset='set3')
with open("static/robots/"+hash+"3.png", "wb") as f:
    rh.img.save(f, format="png")
rh = Robohash(hash)
rh.assemble(roboset='set4')
with open("static/robots/"+hash+"4.png", "wb") as f:
    rh.img.save(f, format="png")
rh = Robohash(hash)
rh.assemble(roboset='set5')
with open("static/robots/"+hash+"5.png", "wb") as f:
    rh.img.save(f, format="png")