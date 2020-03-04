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
struct NewColumnVar {
	int column;
	std::string type;
	int row[];
	std::string name;
};

struct NewColumn {
	std::string formula;
	NewColumnVar vars[];//This is actually map of name to formula
	flat_hash_map<long,std::vector<Cppdata>> fullmap;
};

void makeFullMap(NewColumn newcol) {
	fullmap.clear();
	int varsz = newcol.vars.size();
	int i;
	for (i=0;i<varsz;i++){
		NewColumnVar var;
		var.column = newcol.vars[i].column;
		var.type = newcol.vars[i].type;
		var.row = newcol.vars[i].row;
		var.name = ??;
		if (var.column == -1 || var.type=="value"){
			continue;
		}
		int rowStart = 0;
		int rowEnd = lengthofarray - 1;
		/*var rows = var.row.split(',');
		if (rows.length <2){continue;}
		var rowStart; var rowEnd;
		if (rows[0].indexOf('$')==0 && rows[1].indexOf('$')==0){
			rowStart = parseInt(rows[0].substring(1));
			rowEnd = parseInt(rows[1].substring(1));
			if (rowEnd < 0){
				rowEnd = array.length + rowEnd;
			}
			if (rowEnd > array.length-1){
				rowEnd = array.length - 1;
			}
			if (rowStart < 0){
				rowStart = array.length + rowStart;
			}
			rowEnd = rowEnd;
			rowStart = rowStart;
			if (rowStart < 0){
				rowStart = 0;
			}
		}
		else {
			continue;
		}*/
		int ii;
		if (var.type=='mean'){
			int sum = 0;//Make this Cppdata -- of first row or 0
			int n = 0;
			
			for (ii=rowStart;ii<=rowEnd;ii++){
				sum += parseInt(array[ii][var.column]);
				n++;
			}
			if (n > 0){
				fullmap[var.name]=sum/n;
			}
		}
		else if (var.type=='count'){
			int n = 0;
			for (ii=rowStart;ii<=rowEnd;ii++){
				n++;
			}
			fullmap[var.name]=n;
		}
		else if (var.type=='sum'){
			int sum = 0;
			for (ii=rowStart;ii<=rowEnd;ii++){
				sum += parseInt(array[ii][var.column]);
			}
			fullmap[var.name]=sum;
		}
		else if (var.type=='max'){
			int max = parseInt(array[rowStart][var.column]);
			for (ii=rowStart;ii<=rowEnd;ii++){
				if (parseInt(array[ii][var.column]) > max){
					max = parseInt(array[ii][var.column]);
				}
			}
			fullmap[var.name]=max;
		}
		else if (var.type=='min'){
			int min = parseInt(array[rowStart][var.column]);
			for (ii=rowStart;ii<=rowEnd;ii++){
				if (parseInt(array[ii][var.column]) < min){
					min = parseInt(array[ii][var.column]);
				}
			}
			fullmap[var.name]=min;
		}
	}
}