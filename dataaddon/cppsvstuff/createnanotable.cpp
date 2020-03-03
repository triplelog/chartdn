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
#include "parallel_hashmap/phmap.h"
//#include "lz4.h"
//#include <boost/accumulators/statistics/covariance.hpp>
//#include <boost/accumulators/statistics/variates/covariate.hpp>
//#include <boost/integer/common_factor_rt.hpp> works but no improvement seen for lcm in small test
//#include <boost/sort/pdqsort/pdqsort.hpp>
#include "parser.hpp"
#include "cppdatatemp.hpp"

using namespace aria::csv;
using namespace std::chrono;
using phmap::flat_hash_map;

unsigned int now; unsigned int start;
int autoFormat(std::string filen);


struct Cppcols {
	std::vector<int> ctype;
	std::vector<std::string> cname;
	std::vector<int> carrayindex;
};


int outputArray(int startRow, int endRow, std::vector<Cppdata> *statarray);
int index_sort(std::vector<Cppdata> *statarray);
int output_to_csv(std::string csvfile, int startRow, int EndRow, std::vector<Cppdata> *statarray, bool isdisplay);

const int pasize = 5000;
int plen;


bool sortString = false;
int sortCol;
Cppcols mycols;
std::vector<std::vector<std::string>> strarray;
std::vector<std::string> split(std::string strToSplit, char delimeter)
{
    std::stringstream ss(strToSplit);
    std::string item;
    std::vector<std::string> splittedStrings;
    while (std::getline(ss, item, delimeter))
    {
       splittedStrings.push_back(item);
    }
    return splittedStrings;
}
Cppdata solvePostfix(char exp[], Cppdata stack[], Cppdata const intArray[]);

inline bool operator<(const std::vector<Cppdata>& a, const std::vector<Cppdata>& b)
{
	if (sortString){
		
		if (strarray[a[0].v][sortCol].compare(strarray[b[0].v][sortCol]) < 0){ return true;}
		else if (strarray[a[0].v][sortCol].compare(strarray[b[0].v][sortCol]) > 0){ return false;}
		else {return a[0].v < b[0].v;}
	}
	else {
		if (a[sortCol] > b[sortCol]){ return true;}
		else if (a[sortCol] < b[sortCol]){ return false;}
		else {return a[0].v < b[0].v;}
	}
	return false;
}








int fast_atoi( const char * str )
{
    int val = 0;
    while( *str ) {
        val = val*10 + (*str++ - '0');
    }
    return val;
}

int fast_arrtoi( const char str[] )
{
    int val = 0; int i;
    for (i=0;str[i]!='\0';i++) {
        val = val*10 + (str[i] - '0'); i++;
    }
    return val;
}



int load_data(int minI, int maxI, std::string csvfile, std::vector<Cppdata> *statarray) {
	
	std::ifstream f(csvfile);
	CsvParser parser(f);
	int mti = minI; int mtii = 1; int mts = 0; int i; int ii;
	mycols.cname = {"Index"};
	mycols.carrayindex = {0};
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << now << " , reserved , "<< now - start << std::endl;
    
	for (auto& row : parser) {
	  	ii = 1;
	    for (auto& field : row) {
	    	if (mti > minI) {
	    		//Data Rows
	    		if (mycols.ctype[ii] == 1) {statarray[mti-1][mtii] = cppconstructor(field.c_str()); mtii++;}
	    		else {strarray[mti-1][mts] = field; mts++;}
	    		ii++;
	    	}
	    	else {
	    		//Header Row
	    		if (mycols.ctype[ii] == 1) {mycols.cname.push_back(field); mycols.carrayindex.push_back(mtii); mtii++;}
	    		else {mycols.cname.push_back(field); mycols.carrayindex.push_back(mts); mts++;}
	    		ii++;
	    	}
	    	
	    }
	    if (mti == minI){
			for (i = minI;i<maxI;i++) {
				statarray[i].reserve(mtii); //filter column plus room for 1 new col
				statarray[i].resize(mtii);
				statarray[i][0].v = i;
				statarray[i][0].w = 1;
				statarray[i][0].t = 'B';
				strarray[i].reserve(mts);
				strarray[i].resize(mts);
			}
		}
		else if (mti == maxI){
			break;
		}
	    mtii = 1;
	    mts = 0;
	    mti++;
	}
	std::cout << now << " , done , "<< mycols.cname.size() << " , done , "<< statarray[0][1].v << std::endl;
	return 0;
}

int sort_split(int nrows, int sCol, std::vector<Cppdata> *statarray, std::string filebase){

	if (sCol > 0){
		if (mycols.ctype[sCol] == 1){
			sortCol = mycols.carrayindex[sCol];
			sortString = false;
		}
		else if (mycols.ctype[sCol] == 0){
			sortCol = mycols.carrayindex[sCol];
			sortString = true;
			std::cout << sortCol << " , done , "<< sCol << " , e , "<< statarray[0][1].v << std::endl;
		}
		std::partial_sort(&statarray[0],&statarray[nrows],&statarray[plen]);
	}
	std::string csvfile = filebase;
	csvfile += std::to_string(sCol);
	csvfile += ".csv";
	output_to_csv(csvfile,0,nrows,statarray, true);
	
}

int compressAll(std::string filename) {
	
	int i;
	std::string syscommand = "tar -czvf ";
	syscommand += filename;
	syscommand += ".csv.tar.gz ";
	for (i=0;i<mycols.ctype.size();i++) {
		syscommand += filename;
		syscommand += std::to_string(i);
		syscommand += ".csv ";
	}
	syscommand += filename;
	syscommand += "Cpp.txt ";
	syscommand += filename;
	syscommand += ".csv";
	system(syscommand.c_str());
	
	/*
	for (i=0;i<mycols.ctype.size();i++) {
		syscommand = "rm ";
		syscommand += filename;
		syscommand += std::to_string(i);
		syscommand += ".csv";
		system(syscommand.c_str());
	}
	syscommand = "rm ";
	syscommand += filename;
	syscommand += "Cpp.txt";
	system(syscommand.c_str());
	
	syscommand = "rm ";
	syscommand += filename;
	syscommand += ".csv";
	system(syscommand.c_str());
	*/
	
	
}

int main(int argc, char *argv[]) {
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	 
	if (argc > 2){
		std::string filen = argv[1];
		filen += "Cpp.txt";
		FILE *fwptr;
   		fwptr = fopen(filen.c_str(),"w");
   		fclose(fwptr);
   		
   		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << now << " , Data File opened , "<< now - start << std::endl;
   	
		std::string syscommand = "wc -l ";
		syscommand += argv[1];
		syscommand += ".csv > ";
		syscommand += argv[1];
		syscommand += "Cpp.txt";
		system(syscommand.c_str());
		
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << now << " , Data File has total lines , "<< now - start << std::endl;
		
		fwptr = fopen(filen.c_str(),"r");
		char str [80];
		fscanf (fwptr, "%s\n", str);
   		fclose(fwptr);
   		
   		
   		
   		int nlines = atoi(str)/3 + 1;
   		plen = atoi(str);
   		
   		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << nlines << " , Data File read , "<< now - start << std::endl;
		
		std::vector<Cppdata>* statarray = new std::vector<Cppdata>[plen];
		strarray.reserve(plen);
		strarray.resize(plen);
		
		mycols.ctype = {};
		std::vector<std::string> allcols = split(argv[2],',');
		int i;
		for (i=0;i<allcols.size();i++){
			mycols.ctype.push_back(atoi(allcols[i].c_str()));
		}
		
		
		
		fwptr = fopen(filen.c_str(),"w");
		fprintf(fwptr,"%d,", plen);
		
		for (i=0;i<mycols.ctype.size()-1;i++) {
			fprintf(fwptr,"%d,", mycols.ctype[i]);
		}
		fprintf(fwptr,"%d\n", mycols.ctype[mycols.ctype.size()-1]);
   		fclose(fwptr);
		
		std::string csvfile = argv[1];
		csvfile += ".csv";
		load_data(0,plen,csvfile, statarray);
		
		
		
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << nlines << " , loaded , "<< now - start << std::endl;
    	
    	for (i=0;i<mycols.ctype.size();i++) {
    		int nrows = 1000;
    		if (plen<nrows){nrows = plen;}
			sort_split(nrows,i,statarray, argv[1]);
		}
		
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << nlines << " , sorted , "<< now - start << std::endl;
    	
		output_to_csv(csvfile,0,plen,statarray, false);
	
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << nlines << " , csv created , "<< now - start << std::endl;
		
		compressAll(argv[1]);
		
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    	std::cout << now << " , Compressed , "<< now - start << std::endl;
	}
	else {
		std::cout << "argument is filename(without .csv) coltypes_as_-1,0,0,1,..." << std::endl;
	}
	return 0;
}

int getType(const char field[]) {
	//isum is num of digits, dsum # of decimals, fsum #of /, ssum #of " " 
	int isum = 0; int dsum = 0; int fsum = 0; int ssum = 0; int vi;
	for (vi=0;field[vi];vi++) {
		if (isdigit(field[vi])){isum++;}
		else if (field[vi] == '.'){dsum++;}
		else if (field[vi] == '/'){fsum++;}
		else if (field[vi] == ' '){ssum++;}
	}
	if (isum == vi) {return 1;}
	if (isum+dsum == vi && isum > 0) {return 1;}
	if (isum+dsum+fsum+ssum == vi && isum >= dsum && isum > 1) {return 1;}  
	
	
	return 2;
	
}
int autoFormat(std::string filen) {
	filen += "Head.csv";
	std::ifstream f(filen);
	CsvParser parser(f);
	std::vector<int> fieldtypes[10];
	int mtii = 0; int ftype = 0;
	for (mtii=0;mtii<10;mtii++){
		fieldtypes[mtii].resize(29);
	}
	char* fchar;
	int vi;
	for (auto& row : parser) {
  		mtii = 0;
	    for (auto& field : row) {
	    	//fchar = ;
	    	if (field.length() == 0){ftype = 0;}
	    	else {ftype = getType(field.c_str());}
	    	fieldtypes[ftype][mtii]++;
	    	mtii++;
	    }
	}
	for (mtii=0;mtii<29;mtii++) {
		if (fieldtypes[1][mtii] != 1000){
			std::cout << mtii << " is not Int, ";
		}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	std::cout << " , Formatting , "<< now - start << std::endl;
	return 0;
}

int index_sort(std::vector<Cppdata> *statarray){
	int i;
	for (i=0;i<plen;i++) {
		while (statarray[i][0].v != i)
		{
			std::swap(statarray[i],statarray[statarray[i][0].v]);
		}
	}
	return 0;
}


int output_to_csv(std::string csvfile, int startRow, int endRow, std::vector<Cppdata> *statarray, bool isdisplay) {
	FILE *fwptr;
   	fwptr = fopen(csvfile.c_str(),"w");
   	int i; int ii; int mts = 0; int mtii = 1;
   	

		fprintf(fwptr,"\"%s\",%d",mycols.cname[1].c_str(),1);
	
		for (ii=2;ii<mycols.ctype.size();ii++) {
			fprintf(fwptr,",\"%s\",%d",mycols.cname[ii].c_str(),ii);
		}

	fprintf(fwptr,"\n");
	   		
   	for (i=startRow;i<endRow;i++) {
   		mts = 0; mtii = 1;
   		if (mycols.ctype[1] == 0) {fprintf(fwptr,"\"%s\"",strarray[statarray[i][0].v][mts].c_str()); mts++;}
   		else if (mycols.ctype[1] == 1) {
   			if (statarray[i][1].t == 'R') {fprintf(fwptr,"%d/%d",statarray[i][1].v,statarray[i][1].w);}
   			else if (statarray[i][1].t == 'F') {
   				fprintf(fwptr,",%s",outputF(statarray[i][1]).c_str());
   			}
   			else if (statarray[i][1].t == 'D') {
				if (isdisplay) {fprintf(fwptr,",%s",outputDate(statarray[i][1]).c_str());}
				else {fprintf(fwptr,",\"/%d\"",statarray[i][1].w);}
			}
   			else {fprintf(fwptr,"%d",statarray[i][1].v);}
   			mtii++;
   		}
   		
   		for (ii=2;ii<mycols.ctype.size();ii++) {
   			if (mycols.ctype[ii] == 0) {fprintf(fwptr,",\"%s\"",strarray[statarray[i][0].v][mts].c_str()); mts++;}
   			else if (mycols.ctype[ii] == 1) {
   				if (statarray[i][mtii].t == 'R') {fprintf(fwptr,",\"%d/%d\"",statarray[i][mtii].v,statarray[i][mtii].w);}
				else if (statarray[i][mtii].t == 'F') {
   					fprintf(fwptr,",%s",outputF(statarray[i][mtii]).c_str());
				}
				else if (statarray[i][mtii].t == 'D') {
   					if (isdisplay) {fprintf(fwptr,",%s",outputDate(statarray[i][mtii]).c_str());}
					else {fprintf(fwptr,",\"/%d\"",statarray[i][mtii].w);}
				}
				else {fprintf(fwptr,",%d",statarray[i][mtii].v);}
				mtii++;
			}
   		}
   		fprintf(fwptr,"\n");
   	}
   	
   	fclose(fwptr);
}