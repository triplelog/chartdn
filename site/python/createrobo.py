from robohash import Robohash
import sys

hash = sys.argv[1]
rh = Robohash(hash)
rh.assemble(roboset='any')
with open("../static/robots/"+hash+".png", "wb") as f:
    rh.img.save(f, format="png")