from robohash import Robohash
import sys
import time

hash = sys.argv[1]
for i in range(2,len(sys.argv)):
	rh = Robohash(hash)
	rh.assemble(roboset='set'+sys.argv[i])
	with open("static/robots/"+hash+sys.argv[i]+".png", "wb") as f:
		rh.img.save(f, format="png")
