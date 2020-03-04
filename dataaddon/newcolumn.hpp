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
	int row[4];
	std::string name;
};

struct NewColumn {
	std::string formula;
	flat_hash_map<std::string,Cppdata> fullmap;
	std::vector<NewColumnVar> vars;//This is actually map of name to formula
};

void makeFullMap(NewColumn newcol) {
	newcol.fullmap.clear();
	int varsz = newcol.vars.size();
	int i;
	for (i=0;i<varsz;i++){
		NewColumnVar var = newcol.vars[i];
		if (var.column == -1 || var.type=="value"){
			continue;
		}
		int rowStart = 0;
		int rowEnd = temparray.size() - 1;

		if (var.row[0]>-2 && var.row[1]>-2){
			rowStart = var.row[0];
			rowEnd = var.row[1];
			if (rowEnd < 0){
				rowEnd = temparray.size() + rowEnd;
			}
			if (rowEnd > temparray.size()-1){
				rowEnd = temparray.size() - 1;
			}
			if (rowStart < 0){
				rowStart = temparray.size() + rowStart;
			}
			if (rowStart > temparray.size()-1){
				rowStart = temparray.size() - 1;
			}
		}
		else {
			continue;
		}
		int ii;
		if (var.type=="mean"){
			Cppdata sum = temparray[rowStart][var.column];
			int n = 0;
			for (ii=rowStart+1;ii<=rowEnd;ii++){
				sum = sum + temparray[ii][var.column];
				n++;
			}
			if (n > 0){
				newcol.fullmap[var.name]=sum/Cppdata(n);
			}
		}
		else if (var.type=="count"){
			int n = 0;
			for (ii=rowStart;ii<=rowEnd;ii++){
				n++;
			}
			newcol.fullmap[var.name]=Cppdata(n);
		}
		else if (var.type=="sum"){
			Cppdata sum = temparray[rowStart][var.column];
			for (ii=rowStart+1;ii<=rowEnd;ii++){
				sum = sum + temparray[ii][var.column];
			}
			newcol.fullmap[var.name]=sum;
		}
		else if (var.type=="max"){
			Cppdata max = temparray[rowStart][var.column];
			for (ii=rowStart+1;ii<=rowEnd;ii++){
				if (temparray[ii][var.column] > max){
					max = temparray[ii][var.column];
				}
			}
			newcol.fullmap[var.name]=max;
		}
		else if (var.type=="min"){
			Cppdata min = temparray[rowStart][var.column];
			for (ii=rowStart+1;ii<=rowEnd;ii++){
				if (temparray[ii][var.column] < min){
					min = temparray[ii][var.column];
				}
			}
			newcol.fullmap[var.name]=min;
		}
	}
}

flat_hash_map<std::string,Cppdata> makeRowMap(NewColumn newcol,int idx){
	flat_hash_map<std::string,Cppdata> rowmap;
	int varsz = newcol.vars.size();
	bool skipi = false;
	int i;
	for (i=0;i<varsz;i++){
		NewColumnVar var = newcol.vars[i];
		if (var.column == -1){
			rowmap[var.name]=Cppdata(idx);
		}
		else if (var.type=="value"){
			int row = idx;
			if (var.row[0]>-2){
				row = var.row[0];
			}
			else {
				row += var.row[2];
			}
			if (row < 0 || row >= temparray.size()){
				skipi = true;
				break;
			}
			else {
				rowmap[var.name]=temparray[row][var.column];
			}
		}/*
		else {
			var rows = vars[ii].row.split(',');
			var rowStart; var rowEnd;
			if (rows[0].indexOf('$')==0 && rows[1].indexOf('$')==0){
				continue;
			}
			else {
				if (rows[0].indexOf('$')==0){
					rowStart = parseInt(rows[0].substring(1));
				}
				else {
					rowStart = parseInt(rows[0])+parseInt(i);
				}
				if (rows[1].indexOf('$')==0){
					rowEnd = parseInt(rows[1].substring(1));
				}
				else {
					rowEnd = parseInt(rows[1])+parseInt(i);
				}
				if (rowEnd < 0){
					rowEnd = array.length + rowEnd;
				}
				if (rowEnd > array.length-1){
					rowEnd = array.length - 1;
				}
				if (rowStart < 0){
					rowStart = array.length + rowStart;
				}
				rowEnd = rowEnd - nHeaders;
				rowStart = rowStart - nHeaders;
				if (rowStart < 0){
					rowStart = 0;
				}
				if (vars[ii].type=='mean'){
					var sum = 0;
					var n = 0;
					for (var i=rowStart;i<=rowEnd;i++){
						sum += parseInt(array[i][vars[ii].column]);
						n += 1;
					}
					if (n > 0){
						rowmap[ii.toUpperCase()]=sum/n;
					}
				}
				else if (vars[ii].type=='count'){
					var n = 0;
					for (var i=rowStart;i<=rowEnd;i++){
						n += 1;
					}
					rowmap[ii.toUpperCase()]=n;
				}
				else if (vars[ii].type=='sum'){
					var sum = 0;
					for (var i=rowStart;i<=rowEnd;i++){
						sum += parseInt(array[i][vars[ii].column]);
					}
					rowmap[ii.toUpperCase()]=sum;
				}
				else if (vars[ii].type=='max'){
					var max = parseInt(array[rowStart][vars[ii].column]);
					for (var i=rowStart;i<=rowEnd;i++){
						if (parseInt(array[i][vars[ii].column]) > max){
							max = parseInt(array[i][vars[ii].column]);
						}
					}
					rowmap[ii.toUpperCase()]=max;
				}
				else if (vars[ii].type=='min'){
					var min = parseInt(array[rowStart][vars[ii].column]);
					for (var i=rowStart;i<=rowEnd;i++){
						if (parseInt(array[i][vars[ii].column]) < min){
							min = parseInt(array[i][vars[ii].column]);
						}
					}
					rowmap[ii.toUpperCase()]=min;
				}
			}
		}*/
	}
	/*if (skipi){
		return 'skip';
	}
	else {
		return rowmap;
	}*/
	return rowmap;
}