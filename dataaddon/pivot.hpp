#include <stdio.h>
#include <stdlib.h>
#include <algorithm>
#include <math.h>
#include <limits.h>
#include <time.h>
#include <string.h> 
#include <ctype.h>
#include <iostream>
#include <variant>
#include <map>
#include <numeric>
#include <chrono>
#include <thread>
#include <sstream>
#include <iostream>
#include <array>
#include "parallel_hashmap/phmap.h"

using namespace std::chrono;


struct Pivot {
	int pivotcol;
	std::vector<int> columns;
	std::vector<std::string> types;
	flat_hash_map<std::string,std::vector<Cppdata>> fullmap;
};


flat_hash_map<std::string,std::vector<Cppdata>> MakeFullMap(Pivot pivot) {
	int sz = temparray.size();
	int i;
	int csz = pivot.columns.size();
	int ii;
	flat_hash_map<std::string,std::vector<Cppdata>>::iterator f;
	for (i=0;i<sz;i++){
		if (pivot.pivotcol < temparray[i].size()){
			Cppdata kk = temparray[i][pivot.pivotcol];
			std::string k;
			if (kk.t == 'S'){
				k = strarray[kk.v][kk.w];
			}
			else {
				//k = kk.t + kk.v + kk.w;
			}
			f = pivot.fullmap.find(k);
			if (f == pivot.fullmap.end()){
				pivot.fullmap[k]={};
				for (ii=0;ii<csz;ii++) {
					int col = pivot.columns[ii];
					std::string type = pivot.types[ii];
					if (type=="count"){
						pivot.fullmap[k].push_back(Cppdata(1));
					}
					else if (type=="mean"){
						pivot.fullmap[k].push_back(temparray[i][col]);
						pivot.fullmap[k].push_back(Cppdata(1));
					}
					else{
						pivot.fullmap[k].push_back(temparray[i][col]);
					}
				}
			}
			else {
				int iidx = 0;
				for (ii=0;ii<csz;ii++) {
					int col = pivot.columns[ii];
					std::string type = pivot.types[ii];
					if (type=="count"){
						pivot.fullmap[k][iidx] = pivot.fullmap[k][iidx] + Cppdata(1);
					}
					else if (type=="max"){
						if (temparray[i][col] > pivot.fullmap[k][iidx]){
							pivot.fullmap[k][iidx] = temparray[i][col];
						}
					}
					else if (type=="min"){
						if (temparray[i][col] < pivot.fullmap[k][iidx]){
							pivot.fullmap[k][iidx] = temparray[i][col];
						}
					}
					else if (type=="mean"){
						pivot.fullmap[k][iidx*2] = pivot.fullmap[k][iidx*2] + temparray[i][col];
						pivot.fullmap[k][iidx*2+1] = pivot.fullmap[k][iidx*2+1] + Cppdata(1);
					}
					else{
						pivot.fullmap[k][iidx] = pivot.fullmap[k][iidx] + temparray[i][col];
					}
					iidx++;
				}
			}
			
		}
	}
	return pivot.fullmap;
}


