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
	std::vector<std::string> intstr;
	std::string expstr;
	flat_hash_map<std::string,Cppdata> fullmap;
	std::vector<NewColumnVar> vars;//This is actually map of name to formula
};

NewColumn makeFullMap(NewColumn newcol) {
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
	return newcol;
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
		}
		else {
			int row = idx; int ii;
			int rowStart = 0; int rowEnd = -1;
			if (var.row[0]>-2 && var.row[1]>-2){
				continue;
			}
			else {
				if (var.row[0]>-2){
					rowStart = var.row[0];
				}
				else {
					rowStart = var.row[2]+row;
				}
				if (var.row[0]>-2){
					rowEnd = var.row[1];
				}
				else {
					rowEnd = var.row[3]+row;
				}
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
				if (var.type=="mean"){
					Cppdata sum = temparray[rowStart][var.column];
					int n = 0;
					for (ii=rowStart+1;ii<=rowEnd;ii++){
						sum = sum + temparray[ii][var.column];
						n++;
					}
					if (n > 0){
						rowmap[var.name]=sum/Cppdata(n);
					}
				}
				else if (var.type=="count"){
					int n = 0;
					for (ii=rowStart;ii<=rowEnd;ii++){
						n++;
					}
					rowmap[var.name]=Cppdata(n);
				}
				else if (var.type=="sum"){
					Cppdata sum = temparray[rowStart][var.column];
					for (ii=rowStart+1;ii<=rowEnd;ii++){
						sum = sum + temparray[ii][var.column];
					}
					rowmap[var.name]=sum;
				}
				else if (var.type=="max"){
					Cppdata max = temparray[rowStart][var.column];
					for (ii=rowStart+1;ii<=rowEnd;ii++){
						if (temparray[ii][var.column] > max){
							max = temparray[ii][var.column];
						}
					}
					rowmap[var.name]=max;
				}
				else if (var.type=="min"){
					Cppdata min = temparray[rowStart][var.column];
					for (ii=rowStart+1;ii<=rowEnd;ii++){
						if (temparray[ii][var.column] < min){
							min = temparray[ii][var.column];
						}
					}
					rowmap[var.name]=min;
				}
			}
		}
	}
	/*if (skipi){
		return 'skip';
	}
	else {
		return rowmap;
	}*/
	return rowmap;
}