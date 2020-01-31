from robohash import Robohash
import sys

hash = sys.argv[1]
rh = Robohash(hash)
rh.assemble(roboset='any')
with open("file.png", "wb") as f:
    rh.img.save(f, format="png")