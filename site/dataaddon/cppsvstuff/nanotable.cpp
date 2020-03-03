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


struct Colinfo {
	int arrayindex;
	int displayindex;
	std::string name;
	int uniqueidentifier;
	int ctype;
	std::string countstr;
};




Cppinstructions createInstructions(std::string basestr);
int addColumn(std::string basestr, int startRow, int endRow, const int col, std::vector<Cppdata> *statarray, std::string newcolname);
int addColumnPivot(std::string basestr, const int col, int pivotNumber, std::string newcolname);
int filter(std::string basestr, bool forp, std::vector<Cppdata> *statarray);
int calculateStats();
int outputArray(int startRow, int endRow, std::vector<Cppdata> *statarray);
int pivot(const int xcol, const int ycol, const int zcol, std::vector<Cppdata> *statarray);
int pivotStr(const int xcol, std::vector<Cppdata> *statarray);
int outputPivot(int startRow, int endRow, int pivotNumber);
int rank(std::vector<Cppdata> torank, std::vector<Cppdata> *statarray);
int index_sort(std::vector<Cppdata> *statarray);
int runQuick(std::string tname);
int runSlow(std::string tname, std::vector<Cppdata> *statarray);
int sumProduct(int firstcol, int secondcol, std::vector<Cppdata> *statarray);
int columnOperation(std::string intstr, const int col, std::vector<Cppdata> *statarray, std::vector<Cppdata> *operationsRows);

int pasize = 5000;
struct Cppsplit {
	long id;
	std::string sid = "dknotastring";
	Cppdata val;
	std::string sval;
	std::vector<Cppdata> alldata;
};
struct Cppuser {
	std::vector<std::vector<int>> sortCol;
	int filterCol;
	std::vector<Colinfo> showCols;
	std::vector<Colinfo> pivotCols;
	int partarrayOffset = 0;
	std::vector<Cppdata>* partarray = new std::vector<Cppdata>[pasize];
	std::vector<std::vector<Cppsplit>> pivottables;
	std::vector<Cppdata>* operationsRows = new std::vector<Cppdata>[5];
	explicit Cppuser() : sortCol({}), filterCol(0), showCols({}), pivotCols({}), partarrayOffset(0), partarray(new std::vector<Cppdata>[pasize]), pivottables({}), operationsRows(new std::vector<Cppdata>[5]) {};
	explicit Cppuser(int i) : sortCol({}), filterCol(i), showCols({}), pivotCols({}), partarrayOffset(0), partarray(new std::vector<Cppdata>[pasize]), pivottables({}), operationsRows(new std::vector<Cppdata>[5]) {};
	explicit Cppuser(Cppuser const &a) : sortCol(a.sortCol), filterCol(a.filterCol), showCols(a.showCols), pivotCols(a.pivotCols), partarrayOffset(a.partarrayOffset), partarray(a.partarray), pivottables(a.pivottables), operationsRows(a.operationsRows) {};
};

struct Cppcols {
	std::vector<int> ctype;
	std::vector<std::string> cname;
	std::vector<int> carrayindex;
	//explicit Cppcols() : ctype({}), cname({}), carrayindex({}) {};
	//explicit Cppcols(Cppcols const &a) : ctype(a.ctype), cname(a.cname), carrayindex(a.carrayindex) {};
};

std::string filen;
flat_hash_map<std::string,Cppuser> allusers;
int plen;
int ncols;
int scols;
bool sortFilter = true;
std::vector<std::vector<int>> sortCol;
int vsize = 0;
unsigned int now; unsigned int start;
int col1; int col2;

Cppcols mycols;
std::vector<std::vector<std::string>> strarray;

/*
Cppdata solvePostfix(char exp[], Cppdata stack[], Cppdata const intArray[]);
Cppdata solvePostfixV(char exp[], std::vector<Cppdata> stack, std::vector<Cppdata> const intArray);
*/
inline bool operator<(const std::vector<Cppdata>& a, const std::vector<Cppdata>& b)
{
	if (sortFilter){
		if (a[0].w != 1) {return false;}
		if (b[0].w == 0) {return true;}
	}
	int i;
	for (i=vsize-1;i>-1;i--) {
		if (sortCol[i][0] == 0){
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) < 0) {return true;}
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) > 0) {return false;}
		}
		else if (sortCol[i][0] == 1){
			if (a[sortCol[i][1]] > b[sortCol[i][1]]) {return true;}
			if (a[sortCol[i][1]] < b[sortCol[i][1]]) {return false;}
    	}
    	else if (sortCol[i][0] == 2){
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) > 0) {return true;}
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) < 0) {return false;}
		}
		else {
			if (a[sortCol[i][1]] < b[sortCol[i][1]]) {return true;}
			if (a[sortCol[i][1]] > b[sortCol[i][1]]) {return false;}
    	}
    }
    return false;
}
inline bool operator<(const Colinfo& a, const Colinfo& b)
{
    return a.displayindex < b.displayindex;
}
inline bool operator<(const Cppsplit& a, const Cppsplit& b)
{
    if (a.val > b.val) {return true;}
    else if (a.val < b.val) {return false;}
    else {return a.sval < b.sval;}
}


int fast_atoi( const char * str )
{
    int val = 0;
    while( *str ) {
        val = val*10 + (*str++ - '0');
    }
    return val;
}

int fast_atoi_col( const char * str )
{
    int val = 0; int i = 0;
    while( *str ) {
    	if (i > 0){val = val*10 + (*str++ - '0');}
    	else if (*str != 'c'){val = val*10 + (*str++ - '0');}
    	else {*str++;}
    	i++;
    }
    for (i=0;i<ncols+scols;i++) {
		if (allusers[filen].showCols[i].uniqueidentifier == val ){
			return allusers[filen].showCols[i].arrayindex;
		}
	}
    
    return val;
}
int fast_atoi_col_nors( const char * str )
{
    int val = 0; int i = 0;
    while( *str ) {
    	if (i > 0){val = val*10 + (*str++ - '0');}
    	else if (*str != 'c'){val = val*10 + (*str++ - '0');}
    	else {*str++;}
    	i++;
    }
    for (i=0;i<ncols+scols;i++) {
		if (allusers[filen].showCols[i].uniqueidentifier == val ){
			return allusers[filen].showCols[i].ctype;
		}
	}
    
    return val;
}
int fast_pivotcol( const char * str )
{
    int val = 0; int i = 0;
    while( *str ) {
    	if (i > 0){val = val*10 + (*str++ - '0');}
    	else if (*str == '0' || *str == '1' || *str == '2' || *str == '3' || *str == '4' || *str == '5' || *str == '6' || *str == '7' || *str == '8' || *str == '9'){val = val*10 + (*str++ - '0');}
    	else {*str++;}
    	i++;
    }
    for (i=0;i<ncols+scols;i++) {
		if (allusers[filen].showCols[i].uniqueidentifier == val ){
			return i;
		}
	}
    
    return val;
}
std::string fast_countstr( const char * str )
{
    int i = 0;
    char a[500];
    
    while( *str ) {
    	if (i > 0){a[i-1] = *str;}
    	i++; str++;
    }
    a[i-1] = '\0';
    std::string out = std::string(a);
    return out;
}
int fast_pivottype( const char * str )
{
    int val = 0; int i = 0;
    while( *str ) {
    	if (i > 0){break;}
    	else if (*str == 's'){return 1;}
    	else if (*str == 'x'){return 2;}
    	else if (*str == 'n'){return 3;}
    	else if (*str == 'a'){return 4;}
    	else if (*str == 'f'){return 5;}
    	else if (*str == 'l'){return 6;}
    	else if (*str == 'c'){return 7;}
    	else if (*str == '='){return 10;}
    	else {return 1;}
    	i++;
    }
    return val;
}
int fast_atoi_pcol( const char * str)
{
    int val = 0; int i = 0;
    while( *str ) {
    	if (i > 0){val = val*10 + (*str++ - '0');}
    	else if (*str != 'c'){val = val*10 + (*str++ - '0');}
    	else {*str++;}
    	i++;
    }
    return val;
}

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
Cppdata toCppdata(std::string input_str) {
	std::vector<std::string> threeparts = split(input_str,'.');
	Cppdata outputCpp;
	outputCpp.v = fast_atoi(threeparts[0].c_str());
	outputCpp.w = fast_atoi(threeparts[1].c_str());
	outputCpp.t = threeparts[2].c_str()[0];
	return outputCpp;
}

int load_data(int minI, int maxI, std::string csvfile, std::vector<Cppdata> *statarray) {

    csvfile += ".csv";
    std::ifstream f(csvfile);
	CsvParser parser(f);
	int mti = minI; int mtii = 1; int mts = 0; int i = 0; int ii = 0; int iii = 0;
	mycols.cname = {"Index"};
	mycols.carrayindex = {0};
	
    std::cout << plen << "startplen" << std::endl;
	for (auto& row : parser) {
	  	ii = 1;
	  	int nonblank = 0;
	  	
	    for (auto& field : row) {
	    	if (mti > minI) {
	    		//Data Rows
	    		if (strlen(field.c_str())>0){nonblank++;}
	    		if (mycols.ctype[ii] == 1) {statarray[mti-1][mtii] = cppconstructor(field.c_str()); mtii++;}
	    		else {strarray[mti-1][mts] = field; mts++;}
	    		ii++;
	    	}
	    	else {
	    		//Header Row
	    		iii++;
	    		if (iii%2 == 0){continue;}
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
			if (mti >minI && nonblank < 2) {
				plen--;
			}
			else{
				mti++;
			}
			break;
		}
		
		
			
		if (mti >minI && nonblank < 2) {
			plen--;
		}
		else{
			mti++;
		}

	    mtii = 1;
	    mts = 0;
	    
	    
	}
	
	/*
	syscommand1 = "rm ";
	syscommand1 += csvfile;
	system(syscommand1.c_str());
	*/
	return 0;
}
int setPartarray(std::vector<Cppdata> *statarray, std::vector<Cppdata> *partarray) {
	Cppdata tempCpp; int i; int ii;
    for (i=allusers[filen].partarrayOffset;i<allusers[filen].partarrayOffset+pasize;i++) {
    	partarray[i-allusers[filen].partarrayOffset].reserve(ncols + 2);
		partarray[i-allusers[filen].partarrayOffset].resize(ncols + 2);
    	for (ii=0;ii<ncols+1;ii++) {
    		partarray[i-allusers[filen].partarrayOffset][ii].v = statarray[i][ii].v;
    		partarray[i-allusers[filen].partarrayOffset][ii].w = statarray[i][ii].w;
    		partarray[i-allusers[filen].partarrayOffset][ii].t = statarray[i][ii].t;
    	}
    }
}

int main(int argc, char *argv[])		//main function declaration
{
		//printf("sizeof(short): %d\n", (int) sizeof(short));

  //printf("sizeof(int): %d\n", (int) sizeof(int));
  //printf("sizeof(long): %d\n", (int) sizeof(long));
	if (argc < 1) {std::cout << "arguments are: csvfile(do not include .csv)" << std::endl; return 0;}
	
	
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	  
	
	
	std::string csvfile = "uploads/";
	csvfile += argv[1];
	
	
	
	filen =  csvfile + "Cpp.txt";
	FILE *fwptr;
	fwptr = fopen(filen.c_str(),"r");
	char str [200];
	fscanf (fwptr, "%s\n", str);
	fclose(fwptr);
	std::vector<std::string> finput;
	finput = split(str,',');
	
	plen = atoi(finput[0].c_str()) - 1;
	if (plen < pasize){
		pasize = plen;
	}
	int i;
	ncols = 0;
	scols = 0;
	mycols.ctype = {};
	for (i=1;i<finput.size();i++){
		int cctype = atoi(finput[i].c_str());
		if (cctype == 1){ncols++;}
		else if (cctype == 0){scols++;}
		mycols.ctype.push_back(cctype);
	}

	
	//int nlines = plen/3 + 1;
	std::cout << plen << std::endl;
	std::cout << ncols << std::endl;
	
	
	
	std::vector<Cppdata>* statarray = new std::vector<Cppdata>[plen];

	strarray.reserve(plen);
	strarray.resize(plen);
	
	
	
	
	/*
    std::string csvfile1 = csvfile;
    csvfile1 += "aa";
    std::thread t1 {load_data,0,nlines,csvfile1,statarray};
   
    
    std::string csvfile2 = csvfile;
    csvfile2 += "ab";
    std::thread t2 {load_data,nlines,nlines*2,csvfile2,statarray};
    
    std::string csvfile3 = csvfile;
    csvfile3 += "ac";
    std::thread t3 {load_data,nlines*2,plen,csvfile3,statarray};
	
    t1.join();
    t2.join();
    t3.join();
    */
    
    load_data(0,plen,csvfile,statarray);
    

	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();

    std::cout << statarray[1][24].t << " , loaded , "<< now - start << std::endl;
    std::cout << statarray[1][24].w << " , loaded , "<< now - start << std::endl;
    
    std::cout << mycols.cname[27] << " , loaded , "<< now - start << std::endl;
    
    
    
   	std::thread t4 {runQuick, argv[1]};
   	std::thread t5 {runSlow, argv[1], statarray};

	t4.join();
	t5.join();

    
	return 0;		//terminating function
}


int runQuick(std::string tname) {
	int linesDone = 0;
	int i; int ii;
	std::string queuename = "quick/";
	queuename += tname;
	queuename += ".txt";
	do {
		char fullinput[2500];
		char fullinput1[2500];
		int valsRead = 0;
		int startRow;
		int endRow;
		std::string type;
		std::string instruction;
		FILE *pFile;
		std::vector<std::string> finput;

			
		do {
			pFile = fopen(queuename.c_str(),"r");
			i = 0;
			valsRead = 0;
			while (valsRead > -1 && i <= linesDone){
				valsRead = fscanf(pFile, "%s\n,", fullinput);
				i++;
			}

			if (valsRead > 0) {
				std::string fullinputstr(fullinput);
				finput = split(fullinputstr,',');

				startRow = stoi(finput[1]);
				endRow = stoi(finput[2]);
				if (endRow == -1) {endRow = plen;}
				filen = finput[0];
				type = finput[3];
				instruction = finput[4];

				linesDone++;
				//printf("%d,%d\n",valsRead,linesDone);
				//fflush(stdout);
			}
			else {
				std::this_thread::sleep_for(std::chrono::milliseconds(1));
				fclose(pFile);
				continue;
				//printf("%d,%d\n",valsRead,linesDone);
				//fflush(stdout);
			}
			fclose(pFile);
			

		} while (valsRead <= 0);
	
	
	
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << now << " , start comp , "<< now - start << std::endl;
	
	
	
		if (type == "addcol") {
			std::vector<std::string> bothparts;
			bothparts = split(instruction,'@');



			char exp[bothparts[1].size() +1];
			strcpy(exp,bothparts[1].c_str());
		
			if (bothparts.size() < 4) {
				const int col = ncols +1;
				addColumn(instruction,0,pasize,col, allusers[filen].partarray,bothparts[2]);
			}
			else {
				const int col = allusers[filen].pivottables[0][0].alldata.size();
				std::cout << col << " , pvttable , "<< now - start << std::endl;
				addColumnPivot(instruction,col, 0,bothparts[2]);
			}

			FILE *fwptr;
			fwptr = fopen(filen.c_str(),"w");
			fprintf(fwptr,"completedwithoutoutput");
			fclose(fwptr);

			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , column added , "<< now - start << std::endl;
		}
		else if (type == "print") {
		
			std::cout << now << " , to print , "<< now - start << std::endl;
		

			if (split(instruction,'@')[0] == "pivot"){
				outputPivot(startRow,endRow, atoi(split(instruction,'@')[1].c_str()) );
			}
			else {
				int sRow = 0;
				if (startRow - allusers[filen].partarrayOffset < 0){sRow = 0;}
				else if (startRow - allusers[filen].partarrayOffset >= pasize){sRow = 0;}
				else {sRow = startRow;}
				int eRow = 0;
				if (endRow - allusers[filen].partarrayOffset < 0){eRow = 1;}
				else if (endRow - allusers[filen].partarrayOffset > pasize){eRow = pasize;}
				else {eRow = endRow;}
				outputArray(sRow, eRow, allusers[filen].partarray);
			}
			//Need to check if new partarray is needed.


			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , outputted , "<< now - start << std::endl;
		}
		else if (type == "display") {
		
			std::sort(&allusers[filen].showCols[0],&allusers[filen].showCols[ncols]);
			std::vector<std::string> v = split(split(instruction,'@')[0],'|');
			int endUI = atoi(split(instruction,'@')[1].c_str());
			
			if (v.size() > 1 && endUI == -3) { //List of what to delete
				for(auto&& x: v){
					int startUI = atoi(x.c_str());
					int startCol = 0;
					bool foundUI = false;
		
		
					for (i=0;i<ncols+scols;i++) {
						if (allusers[filen].showCols[i].uniqueidentifier == startUI ){
							startCol = allusers[filen].showCols[i].displayindex;
							foundUI = true;
						}
					}
			
					if (foundUI){
						for (i=0;i<ncols+scols;i++) {
							if (allusers[filen].showCols[i].displayindex > startCol ){
								allusers[filen].showCols[i].displayindex--;
							}
							else if (allusers[filen].showCols[i].displayindex == startCol){
								allusers[filen].showCols[i].displayindex = -1;
							}
						}
					}
				}
			}
			else if (v.size() > 1 && endUI == -4) { // List of what to show
				for (i=0;i<ncols+scols;i++) {
					allusers[filen].showCols[i].displayindex = -1;
				}
				ii = 1;
				for(auto&& x: v){
					int startUI = atoi(x.c_str());
		
					for (i=0;i<ncols+scols;i++) {
						if (allusers[filen].showCols[i].uniqueidentifier == startUI ){
							allusers[filen].showCols[i].displayindex = ii;
							ii++;
							break;
						}
					}
			
				}
			}
			else {
				auto x = v[0];
				int startUI = atoi(x.c_str());
				int startCol = 0;
				int endCol = -1;
				bool foundUI = false;
	
	
				for (i=0;i<ncols+scols;i++) {
					if (allusers[filen].showCols[i].uniqueidentifier == startUI ){
						startCol = allusers[filen].showCols[i].displayindex;
						foundUI = true;
					}
					else if (allusers[filen].showCols[i].uniqueidentifier == endUI){
						endCol = allusers[filen].showCols[i].displayindex;
					}
				}
		
				if (foundUI){
					if (endUI == -3) {endCol = -1;} //Remove
					else if (endUI == -2) {endCol = 0;} //Place at end
		
					if (endCol == -1) {
						for (i=0;i<ncols+scols;i++) {
							if (allusers[filen].showCols[i].displayindex > startCol ){
								allusers[filen].showCols[i].displayindex--;
							}
							else if (allusers[filen].showCols[i].displayindex == startCol){
								allusers[filen].showCols[i].displayindex = -1;
							}
						}
					}
					else if (endCol == 0) {
						for (i=0;i<ncols+scols;i++) {
							if (allusers[filen].showCols[i].displayindex > startCol ){
								allusers[filen].showCols[i].displayindex--;
							}
							else if (allusers[filen].showCols[i].displayindex == startCol){
								allusers[filen].showCols[i].displayindex = ncols+scols+1;
							}
						}
					}
					else if (startCol < endCol){
						for (i=0;i<ncols+scols;i++) {
							if (allusers[filen].showCols[i].displayindex > startCol && allusers[filen].showCols[i].displayindex < endCol ){
								allusers[filen].showCols[i].displayindex--;
							}
							else if (allusers[filen].showCols[i].displayindex == startCol){
								allusers[filen].showCols[i].displayindex = endCol -1;
							}
						}
					}
					else if (endCol < startCol){
						for (i=0;i<ncols+scols;i++) {
							if (allusers[filen].showCols[i].displayindex >= endCol && allusers[filen].showCols[i].displayindex < startCol ){
								allusers[filen].showCols[i].displayindex++;
							}
							else if (allusers[filen].showCols[i].displayindex == startCol){
								allusers[filen].showCols[i].displayindex = endCol;
							}
						}
					}
				}
			}
			int sRow = 0;
			if (startRow - allusers[filen].partarrayOffset < 0){sRow = 0;}
			else if (startRow - allusers[filen].partarrayOffset >= pasize){sRow = 0;}
			else {sRow = startRow;}
			int eRow = 0;
			if (endRow - allusers[filen].partarrayOffset < 0){eRow = 1;}
			else if (endRow - allusers[filen].partarrayOffset > pasize){eRow = pasize;}
			else {eRow = endRow;}
				
			outputArray(sRow, eRow, allusers[filen].partarray);
		
			//Need to check if new partarray is needed.


			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , outputted , "<< now - start << std::endl;
		}
	
	} while (2 == 2);
	return 0;
}
int runSlow(std::string tname, std::vector<Cppdata> *statarray) {
	int linesDone = 0;
	int i; int ii;
	std::string queuename = "slow/";
	queuename += tname;
	queuename += ".txt";
	do {
		char fullinput[2500];
		char fullinput1[2500];
		int valsRead = 0;
		int startRow;
		int endRow;
		std::string type;
		std::string instruction;
		FILE *pFile;
		std::vector<std::string> finput;

	
		
			
		do {
			pFile = fopen(queuename.c_str(),"r");
			i = 0;
			valsRead = 0;
			while (valsRead > -1 && i <= linesDone){
				valsRead = fscanf(pFile, "%s\n,", fullinput);
				i++;
				
			}

			if (valsRead > 0) {

				now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
				std::cout << now << " , start read , "<< now - start << std::endl;
				std::string fullinputstr(fullinput);
				finput = split(fullinputstr,',');

				startRow = stoi(finput[1]);
				endRow = stoi(finput[2]);
				if (endRow == -1) {endRow = plen;}
				filen = finput[0];
				type = finput[3];
				instruction = finput[4];

				linesDone++;
				//printf("%d,%d\n",valsRead,linesDone);
				//fflush(stdout);
				

			}
			else {
				std::this_thread::sleep_for(std::chrono::milliseconds(1));
				fclose(pFile);
				continue;
				//printf("%d,%d\n",valsRead,linesDone);
				//fflush(stdout);
			}
			fclose(pFile);
			

		} while (valsRead <= 0);
	
	
	
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << now << " , start comp , "<< now - start << std::endl;

		if (allusers.count(filen) >0) {
			//justme = allusers[filen];
		}
		else {
			Cppuser justme(0);
			allusers[filen] = justme;
			setPartarray(statarray,allusers[filen].partarray); 
			std::cout << now << " , paafter , "<< now - start << std::endl;
			

			for (i=1;i<ncols+scols+1;i++){
				Colinfo tempcol;
				tempcol.name = mycols.cname[i];
				tempcol.arrayindex = mycols.carrayindex[i];
				tempcol.displayindex = i;
				tempcol.uniqueidentifier = i;
				tempcol.ctype = mycols.ctype[i];
				allusers[filen].showCols.push_back(tempcol);
			}
			
			
		
		}
	
	
		if (type == "addcol") {

			const int col = ncols;
			addColumn(instruction,0,plen,col, statarray,"");
			setPartarray(statarray,allusers[filen].partarray); 

			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , column added , "<< now - start << std::endl;
		}
		else if (type == "filter") {
			
		
			if (endRow == plen) {
				filter(instruction,true,statarray);
			}
			else {
				filter(instruction,false,statarray);
				setPartarray(statarray,allusers[filen].partarray); 
			}

			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , filtered , "<< now - start << std::endl;
		}
		else if (type == "sum") {
			
			columnOperation(type, 14, statarray, allusers[filen].operationsRows);
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , summed , "<< now - start << std::endl;

		}
		else if (type == "max") {
			columnOperation(type, 14, statarray, allusers[filen].operationsRows);
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , maxed , "<< now - start << std::endl;
		}
		else if (type == "min") {
			columnOperation(type, 14, statarray, allusers[filen].operationsRows);
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , maxed , "<< now - start << std::endl;
		}
		else if (type == "mean") {
			columnOperation(type, 14, statarray, allusers[filen].operationsRows);
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , maxed , "<< now - start << std::endl;
		}
		else if (type == "rank") {
			std::vector<Cppdata> torank;
			for (i=0;i<100;i++) {
				torank.push_back(statarray[i][14]);
			}
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , array made , "<< now - start << std::endl;
		
			int ranking = rank(torank,statarray);
		
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << ranking << " , ranked , "<< now - start << std::endl;

		}
		else if (type == "sumproduct") {
		
			int ranking = sumProduct(8,14,statarray);
		
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << ranking << " , sum product , "<< now - start << std::endl;

		}
		else if (type == "pivot") {
			
			
			
			std::vector<std::string> threeparts;
			threeparts = split(instruction,';');
			int ii; int iii = 0;

	
			allusers[filen].pivotCols.clear();
			for (ii=1;ii<threeparts.size();ii++){
				Colinfo tempcol;
				tempcol.displayindex = iii;
				tempcol.uniqueidentifier = iii;
				tempcol.countstr = fast_countstr(threeparts[ii].c_str());
				
				now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
				std::cout << tempcol.countstr << ',' << fast_pivottype(threeparts[ii].c_str()) << " , pivoting , "<< now - start << std::endl;
				
				if (fast_pivottype(threeparts[ii].c_str()) == 7){
					tempcol.name = "COUNTIF";
					tempcol.arrayindex = 0;
					tempcol.ctype = 7;
					allusers[filen].pivotCols.push_back(tempcol);
					iii++;
				}
				else if (fast_pivottype(threeparts[ii].c_str()) == 10){
					std::vector<std::string> twoparts;
					twoparts = split(tempcol.countstr,':');
					tempcol.name = twoparts[0];
					tempcol.countstr = twoparts[1];
					tempcol.arrayindex = 0;
					tempcol.ctype = 10;
					allusers[filen].pivotCols.push_back(tempcol);
					iii++;
				}
				else {
					i = fast_pivotcol(threeparts[ii].c_str());
					tempcol.name = allusers[filen].showCols[i].name;
					tempcol.arrayindex = allusers[filen].showCols[i].arrayindex;
					if (allusers[filen].showCols[i].ctype == 1) {
						tempcol.ctype = fast_pivottype(threeparts[ii].c_str());
						allusers[filen].pivotCols.push_back(tempcol);
						iii++;
					}
					else if (allusers[filen].showCols[i].ctype == 0 && (fast_pivottype(threeparts[ii].c_str()) == 5 || fast_pivottype(threeparts[ii].c_str()) == 6)) {
						tempcol.ctype = -1 * fast_pivottype(threeparts[ii].c_str());
						allusers[filen].pivotCols.push_back(tempcol);
						iii++;
					}
					else if (allusers[filen].showCols[i].ctype == 0) {
						tempcol.ctype = -5;
						allusers[filen].pivotCols.push_back(tempcol);
						iii++;
					}
				}
			}
			
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout <<  " , m pivoting , "<< now - start << std::endl;
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << fast_pivotcol(threeparts[0].c_str()) << " , m pivoting , "<< now - start << std::endl;
				
				
			int pivotcol = fast_pivotcol(threeparts[0].c_str());
			if (allusers[filen].showCols[pivotcol].ctype == 0) {
				pivotStr(allusers[filen].showCols[pivotcol].arrayindex,statarray);
			}
			else {
				pivot(allusers[filen].showCols[pivotcol].arrayindex,fast_atoi_col(threeparts[1].c_str()),0,statarray);
			}
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , pivoted , "<< now - start << std::endl;
		

			//system("graph -T svg -m 0 datafile > static/plot.svg");

			//now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			//std::cout << now << " , graphed , "<< now - start << std::endl;
		}
		else if (type == "sort") {
			//start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			
			std::vector<std::string> threeparts;
			threeparts = split(instruction,'@');
			if (threeparts.size()==1){
				int sortUI = atoi(instruction.c_str());
				if (sortUI == 0){
					index_sort(statarray);
				}
				else {
					std::cout << ncols << " , sort about to start , "<< scols << std::endl;
					for (i=0;i<ncols+scols;i++) {
			
						if (allusers[filen].showCols[i].uniqueidentifier == sortUI) {
							if (allusers[filen].showCols[i].ctype == 1) {
								if (sortCol.size()>0 && sortCol[sortCol.size()-1][1] == allusers[filen].showCols[i].arrayindex){
									allusers[filen].sortCol.push_back({4 - sortCol[sortCol.size()-1][0],allusers[filen].showCols[i].arrayindex});
								}
								else {
									allusers[filen].sortCol.push_back({1,allusers[filen].showCols[i].arrayindex});
								}
							}
							else if (allusers[filen].showCols[i].ctype == 0) {
								if (sortCol.size()>0 && sortCol[sortCol.size()-1][1] == allusers[filen].showCols[i].arrayindex){
									allusers[filen].sortCol.push_back({2 - sortCol[sortCol.size()-1][0],allusers[filen].showCols[i].arrayindex});
								}
								else {
									allusers[filen].sortCol.push_back({0,allusers[filen].showCols[i].arrayindex});
								}
							}
							break;
						}
					}
					sortCol = allusers[filen].sortCol;
					vsize = sortCol.size();
					//Need to check for reset and repeat.
					if (startRow > 250000) {
						std::nth_element(&statarray[0], &statarray[startRow], &statarray[plen]);
						std::partial_sort(&statarray[startRow], &statarray[endRow], &statarray[plen]);
					}
					else {
						//std::partial_sort(&statarray[0], &statarray[endRow + pasize], &statarray[plen]);
						//std::sort(&statarray[0], &statarray[plen]);
						//std::thread t7 {psort, 0, 5000, plen/2, statarray};
						//std::thread t8 {std::partial_sort, &statarray[plen/2], &statarray[plen/2+5000], &statarray[plen]};
						//t7.join();
						//t8.join();
						std::partial_sort(&statarray[0], &statarray[pasize], &statarray[plen]);

					}
				}
		
			
				setPartarray(statarray,allusers[filen].partarray); 
			}
			else {
				if (threeparts[0] == "pivot"){
					int pivotNumber = atoi(threeparts[1].c_str());
					
					std::vector<Cppsplit> splitvector = allusers[filen].pivottables[pivotNumber];
					
					
					int vsize = allusers[filen].pivottables[pivotNumber].size();
					for (i=0;i<vsize;i++) {
						allusers[filen].pivottables[pivotNumber][i].val = allusers[filen].pivottables[pivotNumber][i].alldata[atoi(threeparts[2].c_str())];
					}

					std::sort(&allusers[filen].pivottables[pivotNumber][0],&allusers[filen].pivottables[pivotNumber][vsize]);
				}
			}
			
			
		
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , partial_sort , "<< now - start << std::endl;
		}
		else if (type == "multisort") {
			//start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			
			std::vector<std::string> threeparts;
			threeparts = split(instruction,'@');
			if (threeparts.size()==1){
				int maxsize = atoi(instruction.c_str());
				
				std::cout << ncols << " , multisort about to start , "<< scols << std::endl;
				for (i=0;i<ncols+scols;i++) {
		
					if (allusers[filen].showCols[i].displayindex > -1) {
						allusers[filen].sortCol.clear();
						
						if (allusers[filen].showCols[i].ctype == 1) {
							allusers[filen].sortCol.push_back({1,allusers[filen].showCols[i].arrayindex});
						}
						else if (allusers[filen].showCols[i].ctype == 0) {
							allusers[filen].sortCol.push_back({0,allusers[filen].showCols[i].arrayindex});
						}
						std::partial_sort(&statarray[0], &statarray[maxsize], &statarray[plen]);
						//print something!
					}
				}
				
			}
			else {
				if (threeparts[0] == "pivot"){
					int pivotNumber = 0;
					int maxsize = atoi(threeparts[1].c_str());
					//grab the pivot
					std::vector<Cppsplit> splitvector = allusers[filen].pivottables[pivotNumber];
					
					//sort everything
					int vsize = splitvector.size();
					FILE *fwptr;
					fwptr = fopen(filen.c_str(),"w");
					fprintf(fwptr,"{");
					
					for (ii=0;ii<splitvector[0].alldata.size();ii++){
						fprintf(fwptr,"\"%s\":[",allusers[filen].pivotCols[ii].name.c_str());
						for (i=0;i<vsize;i++) {
							splitvector[i].val = splitvector[i].alldata[ii];
						}

						std::partial_sort(&splitvector[0],&splitvector[maxsize],&splitvector[vsize]);

						for (i=0;i<maxsize;i++){
							if (i!=0){fprintf(fwptr,",");}
							if (splitvector[i].alldata[ii].t == 'I') {
								fprintf(fwptr,"[\"%s\",%d]",splitvector[i].sid.c_str(),splitvector[i].alldata[ii].v);
							}
							else if (splitvector[i].alldata[ii].t == 'R' && splitvector[i].alldata[ii].w != 0) {

								fprintf(fwptr,"[\"%s\",\"%d/%d\"]",splitvector[i].sid.c_str(), splitvector[i].alldata[ii].v,splitvector[i].alldata[ii].w );
							}
							else if (splitvector[i].alldata[ii].t == 'F') {
								fprintf(fwptr,"[\"%s\",%s]",splitvector[i].sid.c_str(),outputF(splitvector[i].alldata[ii]).c_str());
							}
							else {
								fprintf(fwptr,"[\"%s\",\"??\"]",splitvector[i].sid.c_str());
							}
						}
						if (ii<splitvector[0].alldata.size()-1) {fprintf(fwptr,"],");}
						else {fprintf(fwptr,"]");}
						
					}
					
					
					fprintf(fwptr,"}");
					fclose(fwptr);
				}
			}
			
			
		
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , multi_sort done , "<< now - start << std::endl;
		}
		

		
		if (type != "sum" && type != "max" && type != "min" && type != "mean" && type != "multisort") {
			FILE *fwptr;
			fwptr = fopen(filen.c_str(),"w");
			fprintf(fwptr,"completedwithoutoutput");
			fclose(fwptr);
			
			now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
			std::cout << now << " , outputted , "<< now - start << std::endl;
		}
		


	} while (2 == 2);
	return 0;
}

int addColumn(std::string basestr, int startRow, int endRow, const int col, std::vector<Cppdata> *statarray, std::string newcolname)
{
	Cppdata newcol;

	int i; int ii = 0; 


	std::cout << col << ncols << std::endl;
	
	for (i=startRow;i<endRow;i++){
		if (statarray[i].size() < col + 1) {
			statarray[i].reserve(col+1);
			statarray[i].resize(col+1);
		}

	}
	Cppinstructions ci = createInstructions(basestr);


	for (i=startRow;i<endRow;i++){
		for (ii=0;ii<ci.caSize;ii++){ci.intArray[ci.colArray1[ii]] = statarray[i][ci.colArray2[ii]];}
		for (ii=0;ii<ci.casSize;ii++){
			std::string x = strarray[statarray[i][0].v][ci.colArray2s[ii]];
			if (ci.colArray1s[ii]<0){
				int newid = ci.colArray1s[ii]*-1;
				if (x < ci.ciStrArray[newid-1]){ci.intArray[newid] = Cppdata(-2); }
				else if (x == ci.ciStrArray[newid-1]) {ci.intArray[newid] = ci.intArray[newid-1];}
				else {ci.intArray[newid] = Cppdata(2);}
				ci.intArray[newid].t = 'S';
			}
			else {
				int newid = ci.colArray1s[ii];
				if (ci.intArray[newid+1].v == -1) {
					ci.ciStrArray[newid] = x;
				}
				else {
					if (x < ci.ciStrArray[newid+1]){ci.intArray[newid] = Cppdata(-2);}
					else if (x == ci.ciStrArray[newid+1]) {ci.intArray[newid] = ci.intArray[newid+1];}
					else {ci.intArray[newid] = Cppdata(2);}
				}
				ci.intArray[newid].t = 'S';
			}
			//std::cout << x << ",";
			
		}
		newcol = solvePostfixV(ci.exp, ci.stack, ci.intArray);
		//std::cout << newcol.w << std::endl;
		statarray[i][col] = newcol;
				
	}
	if (newcolname.length()>0) {
		ncols++;
		Colinfo tempcol;
		tempcol.name = newcolname;
		tempcol.arrayindex = col;
		tempcol.displayindex = col+scols;
		tempcol.uniqueidentifier = col+scols;
		tempcol.ctype = 1;
		allusers[filen].showCols.push_back(tempcol);
	}
	std::cout << col << ncols << std::endl;
	return 0;

}
int addColumnPivot(std::string basestr, const int col, int pivotNumber, std::string newcolname)
{
	Cppdata newcol;

	int i; int ii = 0; 


	std::cout << col << ncols << std::endl;
	

	Cppinstructions ci = createInstructions(basestr);

	
	
	std::vector<Cppsplit> splitvector = allusers[filen].pivottables[pivotNumber];
	int spsize = splitvector.size();

	
	for (i=0;i<spsize;i++){
		if (splitvector[i].alldata.size() < col + 1) {
			splitvector[i].alldata.reserve(col+1);
			splitvector[i].alldata.resize(col+1);
		}

	}



	for (i=0;i<spsize;i++){
		for (ii=0;ii<ci.caSize;ii++){ci.intArray[ci.colArray1[ii]] = splitvector[i].alldata[ci.colArray2[ii]];}

		newcol = solvePostfixV(ci.exp, ci.stack, ci.intArray);
		splitvector[i].alldata[col] = newcol;
				
	}
	if (newcolname.length()>0) {
		Colinfo tempcol;
		tempcol.name = newcolname;
		tempcol.arrayindex = 0;
		tempcol.displayindex = 0;
		tempcol.uniqueidentifier = col;
		tempcol.ctype = 1;
		allusers[filen].pivotCols.push_back(tempcol);
	}
	allusers[filen].pivottables[pivotNumber] = splitvector;
	return 0;

}
int columnOperation(std::string intstr, const int col, std::vector<Cppdata> *statarray, std::vector<Cppdata> *operationsRows)
{
	int i; int ii; int filtern = 0;
	for (ii=4;ii<23;ii++){
		if (operationsRows[0].size() < ii-3){
			operationsRows[0].push_back(Cppdata(0));
		}
		else {
			operationsRows[0][ii-4] = Cppdata(0);
		}
		if (operationsRows[1].size() < ii-3){
			operationsRows[1].push_back(Cppdata(0));
		}
		else {
			operationsRows[1][ii-4] = Cppdata(0);
		}
		if (operationsRows[2].size() < ii-3){
			operationsRows[2].push_back(Cppdata(0));
		}
		else {
			operationsRows[2][ii-4] = Cppdata(0);
		}
	}
	
	for (i=0;i<plen;i++){
		if (statarray[i][0].w == 1) {
			for (ii=4;ii<23;ii++){
				operationsRows[1][ii-4] = statarray[i][ii];
				operationsRows[2][ii-4] = statarray[i][ii];
			}
			break;
		}
	}

	for (i=0;i<plen;i++){
		if (statarray[i][0].w == 1) {
			for (ii=4;ii<23;ii++){
				operationsRows[0][ii-4] = operationsRows[0][ii-4] + statarray[i][ii];
				if (statarray[i][ii] < operationsRows[1][ii-4]) {operationsRows[1][ii-4] = statarray[i][ii];}
				else if (statarray[i][ii] > operationsRows[2][ii-4]) {operationsRows[2][ii-4] = statarray[i][ii];}
			}
			filtern++;
		}
	}
	
	FILE *fwptr;
   	fwptr = fopen(filen.c_str(),"w");
   	fprintf(fwptr,"foot[[0");
   	for (i=0;i<ncols+scols;i++) {
   		if (i>=4 && i<23){
   			if (intstr == "sum"){
   				fprintf(fwptr,",%d",operationsRows[0][i-4].v);
   			}
   			else if (intstr == "mean"){
   				if (filtern > 0){
   					fprintf(fwptr,",%d",operationsRows[0][i-4].v/filtern);
   				}
   				else {
   					fprintf(fwptr,",\"NA\"");
   				}
   			}
   			else if (intstr == "max"){
   				fprintf(fwptr,",%d",operationsRows[2][i-4].v);
   			}
   			else if (intstr == "min"){
   				fprintf(fwptr,",%d",operationsRows[1][i-4].v);
   			}
   			else {
   				fprintf(fwptr,",%d",operationsRows[0][i-4].v);
   			}
   		}
   		else {
   			fprintf(fwptr,",\" \"");
   		}
   	}
   	fprintf(fwptr,"]]");
   	fclose(fwptr);
	

	return 0;

}
int pivot(const int xcol, const int ycol, const int zcol, std::vector<Cppdata> *statarray)
{
	//flat_hash_map<int,flat_hash_map<int,std::vector<Cppdata>>> splitmap;
	flat_hash_map<long,std::vector<Cppdata>> splitmap;
	long oldid = 0;
	long id12;
	
	int npcols = allusers[filen].pivotCols.size(); int i; int ii; int iii;
	std::vector<Cppsplit> splitvector;
	std::vector<std::vector<int>> pcaisum;
	std::vector<std::vector<int>> pcaimax;
	std::vector<std::vector<int>> pcaimin;
	std::vector<std::vector<int>> pcaimean;
	std::vector<std::vector<int>> pcaifirst;
	std::vector<std::vector<int>> pcailast;
	std::vector<std::vector<int>> pcaicount;
	std::vector<std::vector<int>> pcaifirststr;
	std::vector<std::vector<int>> pcailaststr;
	int sorttype = -1;
	
	
	int countifs = 0;
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 7) {countifs++;}
	}
	Cppinstructions cif[countifs]; iii = 0;
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 7) {cif[iii] = createInstructions(allusers[filen].pivotCols[ii].countstr); iii++;}
	}
	
	
	
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 1) {pcaisum.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 2) {pcaimax.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 3) {pcaimin.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 4) {pcaisum.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 5) {pcaifirst.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 6) {pcailast.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 7) {pcaicount.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == -5) {pcaifirststr.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == -6) {pcailaststr.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		
		
		
		if (ii == 0 && allusers[filen].pivotCols[ii].ctype < 0) {sorttype = allusers[filen].pivotCols[ii].arrayindex;}
	}
	int npcolssum = pcaisum.size();
	int npcolsmax = pcaimax.size();
	int npcolsmin = pcaimin.size();
	int npcolsmean = pcaimean.size();
	int npcolsfirst = pcaifirst.size();
	int npcolslast = pcailast.size();
	int npcolscount = pcaicount.size();
	int npcolsfirststr = pcaifirststr.size();
	int npcolslaststr = pcailaststr.size();
	Cppsplit tempsplit;
	Cppdata justone = Cppdata(1);
	for (i=0;i<npcols;i++) {
		if (allusers[filen].pivotCols[ii].ctype < 0) {
			tempsplit.alldata.push_back(justone);
		}
		else {
			tempsplit.alldata.push_back(justone);
		}
	}
	int pid; int pval; int vsize = 0;
	splitvector.resize(100000);
	//std::vector<Cppdata> tmphashmap;
	
	std::vector<Cppdata> tmpcppv;
	tmpcppv.resize(npcols);
	
	
	for (i=0;i<plen;i++){
		if (statarray[i][0].w > 0) {
			id12 = statarray[i][xcol].v;
			//id12 = strarray[statarray[i][0].v][xcol];
			if (id12 == oldid){
				for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = tmpcppv[pcaisum[ii][1]] + statarray[i][pcaisum[ii][0]];}
				for (ii=0;ii<npcolsmax;ii++) {if (tmpcppv[pcaimax[ii][1]] < statarray[i][pcaimax[ii][0]]) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}}
				for (ii=0;ii<npcolsmin;ii++) {if (tmpcppv[pcaimin[ii][1]] > statarray[i][pcaimin[ii][0]]) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}}
				
				for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
				for (ii=0;ii<npcolscount;ii++) {
					for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
					tmpcppv[pcaicount[ii][1]] = tmpcppv[pcaicount[ii][1]] + justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray);
				}
				
				for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
			}
			else {
				if (i != 0) {splitmap[oldid] = tmpcppv;}
				oldid = id12;
				if (splitmap.count(id12) >0)
				{ 
					tmpcppv = splitmap[id12];
					for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = tmpcppv[pcaisum[ii][1]] + statarray[i][pcaisum[ii][0]];}
					for (ii=0;ii<npcolsmax;ii++) {if (tmpcppv[pcaimax[ii][1]] < statarray[i][pcaimax[ii][0]]) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}}
					for (ii=0;ii<npcolsmin;ii++) {if (tmpcppv[pcaimin[ii][1]] > statarray[i][pcaimin[ii][0]]) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}}
					
					for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
					for (ii=0;ii<npcolscount;ii++) {
						for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
						tmpcppv[pcaicount[ii][1]] = tmpcppv[pcaicount[ii][1]] + justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray);
					}
					for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
				}  
				else
				{ 
					for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = statarray[i][pcaisum[ii][0]];}
					for (ii=0;ii<npcolsmax;ii++) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}
					for (ii=0;ii<npcolsmin;ii++) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}
					
					for (ii=0;ii<npcolsfirst;ii++) {tmpcppv[pcaifirst[ii][1]] = statarray[i][pcaifirst[ii][0]];}
					for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
					for (ii=0;ii<npcolscount;ii++) {
						for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
						tmpcppv[pcaicount[ii][1]] = justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray);
					}
					for (ii=0;ii<npcolsfirststr;ii++) {tmpcppv[pcaifirststr[ii][1]] = statarray[i][0];}
					for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
					tempsplit.id = id12;
					if (vsize < 100000){
						splitvector[vsize] = tempsplit;
						vsize++;
					}
					else {
						splitvector.push_back(tempsplit);
						vsize++;
					}
				} 
			}
			
		}
	}
	splitmap[oldid] = tmpcppv;
	


	for (i=0;i<vsize;i++) {
		if (sorttype < 0) {splitvector[i].sval = ""; splitvector[i].val = splitmap[splitvector[i].id][0];}
		else {splitvector[i].val = justone; splitvector[i].sval = strarray[splitmap[splitvector[i].id][0].v][sorttype];}
		for (ii=0;ii<npcols;ii++) {
			splitvector[i].alldata[ii] = splitmap[splitvector[i].id][ii];
		}
	}

	if (vsize>25000){
		std::partial_sort(&splitvector[0],&splitvector[25000],&splitvector[vsize]);
		splitvector.resize(25000);
	}
	else {
		splitvector.resize(vsize);
		std::sort(&splitvector[0],&splitvector[vsize]);
	}
	if (allusers[filen].pivottables.size() > 0){
		allusers[filen].pivottables[0] = splitvector;
	}
	else {
		allusers[filen].pivottables.push_back(splitvector);
	}
	

    //Create hash function for Cpppivot.


	return 0;
}
int pivotStr(const int xcol, std::vector<Cppdata> *statarray)
{
	flat_hash_map<std::string,std::vector<Cppdata>> splitmap;
	flat_hash_map<int,int> arrtopiv;
	std::string oldid = "";
	std::string id12 = "";
	
	int npcols = allusers[filen].pivotCols.size(); int i = 0; int ii = 0; int iii = 0;
	std::vector<Cppsplit> splitvector;
	std::vector<std::vector<int>> pcaisum;
	std::vector<std::vector<int>> pcaimax;
	std::vector<std::vector<int>> pcaimin;
	std::vector<std::vector<int>> pcaimean;
	std::vector<std::vector<int>> pcaifirst;
	std::vector<std::vector<int>> pcailast;
	std::vector<std::vector<int>> pcaicount;
	std::vector<std::vector<int>> pcaifirststr;
	std::vector<std::vector<int>> pcailaststr;
	int sorttype = -1;
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	std::cout << allusers[filen].pivotCols[0].countstr << " , part11 , "<< now - start << std::endl;
	
	int countifs = 0; int formulaCols = 0;
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 7) {countifs++;}
		else if (allusers[filen].pivotCols[ii].ctype == 10) {formulaCols++;}
		else {arrtopiv[allusers[filen].pivotCols[ii].arrayindex]=ii;}
		
	}
	
	Cppinstructions cif[countifs]; Cppinstructions ff[formulaCols]; iii = 0; int iiii = 0;
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 7) {cif[iii] = createInstructions(allusers[filen].pivotCols[ii].countstr); iii++;}
		else if (allusers[filen].pivotCols[ii].ctype == 10) {ff[iiii] = createInstructions(allusers[filen].pivotCols[ii].countstr); iiii++;}
	}
	
	
	for (ii=0;ii<npcols;ii++) {
		if (allusers[filen].pivotCols[ii].ctype == 1) {pcaisum.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 2) {pcaimax.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 3) {pcaimin.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 4) {pcaisum.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 5) {pcaifirst.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 6) {pcailast.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == 7) {pcaicount.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == -5) {pcaifirststr.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		else if (allusers[filen].pivotCols[ii].ctype == -6) {pcailaststr.push_back({allusers[filen].pivotCols[ii].arrayindex,ii});}
		
		
		
		if (ii == 0 && allusers[filen].pivotCols[ii].ctype < 0) {sorttype = allusers[filen].pivotCols[ii].arrayindex;}
	}
	int npcolssum = pcaisum.size();
	int npcolsmax = pcaimax.size();
	int npcolsmin = pcaimin.size();
	int npcolsmean = pcaimean.size();
	int npcolsfirst = pcaifirst.size();
	int npcolslast = pcailast.size();
	int npcolscount = pcaicount.size();
	int npcolsfirststr = pcaifirststr.size();
	int npcolslaststr = pcailaststr.size();
	Cppsplit tempsplit;
	Cppdata justone = Cppdata(1);
	for (i=0;i<npcols;i++) {
		if (allusers[filen].pivotCols[ii].ctype < 0) {
			tempsplit.alldata.push_back(justone);
		}
		else {
			tempsplit.alldata.push_back(justone);
		}
	}
	int pid = 0; int pval = 0; int vsize = 0;
	splitvector.resize(100000);
	//std::vector<Cppdata> tmphashmap;
	
	std::vector<Cppdata> tmpcppv;
	tmpcppv.resize(npcols);
	
	
	for (i=0;i<plen;i++){
		if (statarray[i][0].w > 0) {
			//id12 = statarray[i][xcol].v*10000 + statarray[i][zcol].v;
			id12 = strarray[statarray[i][0].v][xcol];
			if (id12 == oldid){
				for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = tmpcppv[pcaisum[ii][1]] + statarray[i][pcaisum[ii][0]];}
				for (ii=0;ii<npcolsmax;ii++) {if (tmpcppv[pcaimax[ii][1]] < statarray[i][pcaimax[ii][0]]) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}}
				for (ii=0;ii<npcolsmin;ii++) {if (tmpcppv[pcaimin[ii][1]] > statarray[i][pcaimin[ii][0]]) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}}
				
				for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
				for (ii=0;ii<npcolscount;ii++) {
					for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
					tmpcppv[pcaicount[ii][1]] = tmpcppv[pcaicount[ii][1]] + justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray);
				}
				
				for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
			}
			else {
				if (i != 0) {splitmap[oldid] = tmpcppv;}
				oldid = id12;
				if (splitmap.count(id12) >0)
				{ 
					tmpcppv = splitmap[id12];
					for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = tmpcppv[pcaisum[ii][1]] + statarray[i][pcaisum[ii][0]];}
					for (ii=0;ii<npcolsmax;ii++) {if (tmpcppv[pcaimax[ii][1]] < statarray[i][pcaimax[ii][0]]) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}}
					for (ii=0;ii<npcolsmin;ii++) {if (tmpcppv[pcaimin[ii][1]] > statarray[i][pcaimin[ii][0]]) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}}
					
					for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
					for (ii=0;ii<npcolscount;ii++) {
						for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
						tmpcppv[pcaicount[ii][1]] = tmpcppv[pcaicount[ii][1]] + justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray);
					}
					for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
				}  
				else
				{ 
					for (ii=0;ii<npcolssum;ii++) {tmpcppv[pcaisum[ii][1]] = statarray[i][pcaisum[ii][0]];}
					for (ii=0;ii<npcolsmax;ii++) {tmpcppv[pcaimax[ii][1]] = statarray[i][pcaimax[ii][0]];}
					for (ii=0;ii<npcolsmin;ii++) {tmpcppv[pcaimin[ii][1]] = statarray[i][pcaimin[ii][0]];}
					
					for (ii=0;ii<npcolsfirst;ii++) {tmpcppv[pcaifirst[ii][1]] = statarray[i][pcaifirst[ii][0]];}
					for (ii=0;ii<npcolslast;ii++) {tmpcppv[pcailast[ii][1]] = statarray[i][pcailast[ii][0]];}
					for (ii=0;ii<npcolscount;ii++) {
						for (iii=0;iii<cif[ii].caSize;iii++){cif[ii].intArray[cif[ii].colArray1[iii]] = statarray[i][cif[ii].colArray2[iii]];}
						tmpcppv[pcaicount[ii][1]] = justone * solvePostfixV(cif[ii].exp, cif[ii].stack, cif[ii].intArray); //returns boolean so need to convert to integer
					}
					for (ii=0;ii<npcolsfirststr;ii++) {tmpcppv[pcaifirststr[ii][1]] = statarray[i][0];}
					for (ii=0;ii<npcolslaststr;ii++) {tmpcppv[pcailaststr[ii][1]] = statarray[i][0];}
					tempsplit.sid = id12;
					if (vsize < 100000){
						splitvector[vsize] = tempsplit;
						vsize++;
					}
					else {
						splitvector.push_back(tempsplit);
						vsize++;
					}
				} 
			}
			
		}
	}
	splitmap[oldid] = tmpcppv;
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	std::cout << vsize << " , part1 , "<< now - start << std::endl;
	
	
	for (i=0;i<vsize;i++) {
		iiii = 0;
		if (sorttype < 0) {splitvector[i].sval = ""; 
			if (allusers[filen].pivotCols[0].ctype != 10){
				splitvector[i].val = splitmap[splitvector[i].sid][0];
			}
			else {
				for (iii=0;iii<ff[iiii].caSize;iii++){
					ff[iiii].intArray[ff[iiii].colArray1[iii]] = splitmap[splitvector[i].sid][arrtopiv[ff[iiii].colArray2[iii]]];
				}
				splitvector[i].val =  solvePostfixV(ff[iiii].exp, ff[iiii].stack, ff[iiii].intArray);
				iiii++;
			}
		}
		else {splitvector[i].val = justone; splitvector[i].sval = strarray[splitmap[splitvector[i].sid][0].v][sorttype];}
		
		iiii = 0;
		for (ii=0;ii<npcols;ii++) {
			if (allusers[filen].pivotCols[ii].ctype != 10){
				splitvector[i].alldata[ii] = splitmap[splitvector[i].sid][ii];
			}
			else {
				for (iii=0;iii<ff[iiii].caSize;iii++){
					ff[iiii].intArray[ff[iiii].colArray1[iii]] = splitmap[splitvector[i].sid][arrtopiv[ff[iiii].colArray2[iii]]];
				}
				splitvector[i].alldata[ii] =  solvePostfixV(ff[iiii].exp, ff[iiii].stack, ff[iiii].intArray);
				iiii++;
			}
			
				
		}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	std::cout << now << " , part2 , "<< now - start << std::endl;
	if (vsize>25000){
		std::partial_sort(&splitvector[0],&splitvector[25000],&splitvector[vsize]);
		splitvector.resize(25000);
	}
	else {
		splitvector.resize(vsize);
		std::sort(&splitvector[0],&splitvector[vsize]);
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	std::cout << splitvector[0].sid << " , part3 , "<< now - start << std::endl;
	if (allusers[filen].pivottables.size() > 0){
		allusers[filen].pivottables[0] = splitvector;
	}
	else {
		allusers[filen].pivottables.push_back(splitvector);
	}

    //Create hash function for Cpppivot.

	return 0;
}

int outputPivot(int startRow, int endRow, int pivotNumber) 
{
	int yctype = 0;
	std::vector<Cppsplit> splitvector = allusers[filen].pivottables[pivotNumber];
	if (splitvector[startRow].sid == "dknotastring"){
		yctype = 1;
	}
	int npcols = allusers[filen].pivotCols.size();
	int ii; int i;
	FILE *fwptr;
   	fwptr = fopen(filen.c_str(),"w");
   	fprintf(fwptr,"[");

   	fprintf(fwptr,"[\"Pivot@%dRk\",-1,\"%s\",0",pivotNumber, "PCOL" );
   	for (ii=0;ii<npcols;ii++){
		fprintf(fwptr,",\"%s\",%d",allusers[filen].pivotCols[ii].name.c_str(),allusers[filen].pivotCols[ii].uniqueidentifier );
	}
	fprintf(fwptr,"]");

	for (i=startRow;i<endRow && i < splitvector.size();i++) {
		if (yctype == 1) {fprintf(fwptr,",[%li,%d", i+1, splitvector[i].id );}
		else if (yctype == 0) {fprintf(fwptr,",[%li,\"%s\"", i+1, splitvector[i].sid.c_str() );}
		
		for (ii=0;ii<npcols;ii++){
			if (allusers[filen].pivotCols[ii].ctype < 0) {
				fprintf(fwptr,",\"%s\"", strarray[splitvector[i].alldata[ii].v][allusers[filen].pivotCols[ii].arrayindex].c_str());
			}
			else {
				if (splitvector[i].alldata[ii].t == 'I') {
					fprintf(fwptr,",%d",splitvector[i].alldata[ii].v);
				}
				else if (splitvector[i].alldata[ii].t == 'R' && splitvector[i].alldata[ii].w != 0) {
					fprintf(fwptr,",\"%d/%d\"",splitvector[i].alldata[ii].v,splitvector[i].alldata[ii].w );
				}
				else if (splitvector[i].alldata[ii].t == 'F') {
					fprintf(fwptr,",%s",outputF(splitvector[i].alldata[ii]).c_str());
				}
				else if (splitvector[i].alldata[ii].t == 'B') {
					if (splitvector[i].alldata[ii].w == 1) {fprintf(fwptr,",\"T\"");}
					else {fprintf(fwptr,",\"F\"");}
				}
				/*
				if (splitvector[i].alldata[ii].t == 'I') {fprintf(fwptr,",%d", splitvector[i].alldata[ii].v);}
				else if (splitvector[i].alldata[ii].t == 'R') {fprintf(fwptr,",%d", splitvector[i].alldata[ii].v * 1000 / splitvector[i].alldata[ii].w  );}
				else if (splitvector[i].alldata[ii].t == 'B') {
					if (splitvector[i].alldata[ii].w == 1) {fprintf(fwptr,",\"T\"");}
					else {fprintf(fwptr,",\"F\"");}
				}*/
				else {fprintf(fwptr,",-1"  );}
			}
		}
		fprintf(fwptr,"]");
	}
	fprintf(fwptr,"]");
	//Need to replace last , with ] if not enough elements -- or do in javascript
    fclose(fwptr);

   
	return 0;		//terminating function
}

int filter(std::string basestr, bool forp, std::vector<Cppdata> *statarray) 
{
	int startRow = 0; int endRow = pasize;
	if (allusers[filen].partarrayOffset > pasize/2 && allusers[filen].partarrayOffset <= plen - pasize/2) {startRow = allusers[filen].partarrayOffset - pasize/2; endRow = startRow + pasize;}
	else if (allusers[filen].partarrayOffset > pasize/2) {startRow = plen - pasize; endRow = plen;}
	
	Cppdata istrue;

	int i; int ii = 0; int filtern = 0;

	Cppinstructions ci = createInstructions(basestr);


	
	
	
	if (forp) {
		for (i=0;i<plen;i++){
			for (ii=0;ii<ci.caSize;ii++){ci.intArray[ci.colArray1[ii]] = statarray[i][ci.colArray2[ii]];}
			for (ii=0;ii<ci.casSize;ii++){
				std::string x = strarray[statarray[i][0].v][ci.colArray2s[ii]];
				if (ci.colArray1s[ii]<0){
					int newid = ci.colArray1s[ii]*-1;
					if (x < ci.ciStrArray[newid-1]){ci.intArray[newid] = Cppdata(-2); }
					else if (x == ci.ciStrArray[newid-1]) {ci.intArray[newid] = ci.intArray[newid-1];}
					else {ci.intArray[newid] = Cppdata(2);}
					ci.intArray[newid].t = 'S';
				}
				else {
					int newid = ci.colArray1s[ii];
					if (ci.intArray[newid+1].v == -1) {
						ci.ciStrArray[newid] = x;
					}
					else {
						if (x < ci.ciStrArray[newid+1]){ci.intArray[newid] = Cppdata(-2);}
						else if (x == ci.ciStrArray[newid+1]) {ci.intArray[newid] = ci.intArray[newid+1];}
						else {ci.intArray[newid] = Cppdata(2);}
					}
					ci.intArray[newid].t = 'S';
				}
				//std::cout << x << ",";
			
			}
			istrue = solvePostfixV(ci.exp, ci.stack, ci.intArray);
	
			if (istrue.w == 1 && istrue.t == 'B') {statarray[i][0].w = 1;}
			else {statarray[i][0].w = 0;}
		}
	}
	else {
		sortFilter = false;
		sortCol = allusers[filen].sortCol;
		vsize = sortCol.size();
		int startSort = 0; int endSort = startSort + 50000;
		do {
			if (endSort < plen){
				std::nth_element(&statarray[startSort], &statarray[endSort], &statarray[plen]);
			}

			for (i=startSort;i<endSort && i<plen;i++){
				//statarray[i].push_back(newcol); ignore this unles need it instead of assignment.
				for (ii=0;ii<ci.caSize;ii++){ci.intArray[ci.colArray1[ii]] = statarray[i][ci.colArray2[ii]];}
				for (ii=0;ii<ci.casSize;ii++){
					std::string x = strarray[statarray[i][0].v][ci.colArray2s[ii]];
					if (ci.colArray1s[ii]<0){
						int newid = ci.colArray1s[ii]*-1;
						if (x < ci.ciStrArray[newid-1]){ci.intArray[newid] = Cppdata(-2); }
						else if (x == ci.ciStrArray[newid-1]) {ci.intArray[newid] = ci.intArray[newid-1];}
						else {ci.intArray[newid] = Cppdata(2);}
						ci.intArray[newid].t = 'S';
					}
					else {
						int newid = ci.colArray1s[ii];
						if (ci.intArray[newid+1].v == -1) {
							ci.ciStrArray[newid] = x;
						}
						else {
							if (x < ci.ciStrArray[newid+1]){ci.intArray[newid] = Cppdata(-2);}
							else if (x == ci.ciStrArray[newid+1]) {ci.intArray[newid] = ci.intArray[newid+1];}
							else {ci.intArray[newid] = Cppdata(2);}
						}
						ci.intArray[newid].t = 'S';
					}
					//std::cout << x << ",";
			
				}
				istrue = solvePostfixV(ci.exp, ci.stack, ci.intArray);
				if (istrue.w == 1 && istrue.t == 'B') {statarray[i][0].w = 1; filtern++;}
				else {statarray[i][0].w = 0;}
			}
			startSort = endSort;
			if (filtern < endRow / 2 || startSort > 100000 || plen < startSort + 100000){
				endSort = plen;
			}
			else {
				endSort = startSort + 100000;
			}
		} while (filtern < endRow && startSort < plen);
		sortFilter = true;
		if (startRow > 250000) {
			std::nth_element(&statarray[0], &statarray[startRow], &statarray[plen]);
			std::partial_sort(&statarray[startRow], &statarray[endRow], &statarray[plen]);
		}
		else {
			std::partial_sort(&statarray[0], &statarray[endRow], &statarray[plen]);
		}
	}
	
	return 0;
}


int mysum(int a, int b) {
	return a + b;
}
int myproduct(std::vector<Cppdata> a, std::vector<Cppdata> b) {
	return a[col1].v * b[col2].v;
}
int rank(std::vector<Cppdata> torank, std::vector<Cppdata> *statarray) {
	std::vector<int> n;
	int i = 0; int trl = 100; int minL = 0; int maxL = 99; int midL; int ii;
	sortCol = allusers[filen].sortCol;
	vsize = sortCol.size();
	std::sort(&torank[0],&torank[trl]);
	for (i=0;i<100;i++){
		n.push_back(0);
	}
    
	for (i=0;i<plen;i++) {
		
		if (statarray[i][14] > torank[99]) {
			for (ii=0;ii<100;ii++){
				n[ii]++;
			}
		}
		else if (statarray[i][14] > torank[0]) {
			do {
				midL = minL + (maxL - minL) / 2;
				if (statarray[i][14] > torank[midL]){
					if (midL == maxL - 1){ 
						for (ii=0;ii<maxL;ii++){
							n[ii]++;
						}
						break;
					}
					else {minL = midL;}
				}
				else {
					if (midL == minL + 1){
						for (ii=0;ii<midL;ii++){
							n[ii]++;
						}
						break;
					}
					else {maxL = midL;}
				} 
			} while (2 == 2);
		}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<100;i++) {
    	std::cout << n[i] << "_" << torank[i].v << ", ";
    }
	return n[0];
}

int sumProduct(int firstcol, int secondcol, std::vector<Cppdata> *statarray) {
	col1 = firstcol; col2 = secondcol;
	return std::inner_product(statarray,statarray+plen,statarray,0,mysum,myproduct);
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

int outputArray(int startRow, int endRow, std::vector<Cppdata> *statarray) {
	int i; int ii;

	FILE *fwptr;
   	fwptr = fopen(filen.c_str(),"w");
   	fprintf(fwptr,"[");

   	fprintf(fwptr,"[\"Rk\",-1" );
   	std::sort(&allusers[filen].showCols[0],&allusers[filen].showCols[ncols+scols]);
   	int iiStart = 0;
	for (i=0;i<ncols+scols;i++) {
		if (allusers[filen].showCols[i].displayindex > -1){
			fprintf(fwptr,",\"%s\",%d", allusers[filen].showCols[i].name.c_str(), allusers[filen].showCols[i].uniqueidentifier );
		}
		else {
			iiStart++;
		}
	}
	fprintf(fwptr,"],");

	
	for (i=startRow;i<endRow;i++) {
		fprintf(fwptr,"[%d", i+1 );
		for (ii =iiStart;ii<ncols+scols;ii++) {
			if (allusers[filen].showCols[ii].ctype == 0) {
				fprintf(fwptr,",\"%s\"", strarray[statarray[i][0].v][allusers[filen].showCols[ii].arrayindex].c_str() );
			}
			else if (allusers[filen].showCols[ii].ctype == 1) {
				if (statarray[i][allusers[filen].showCols[ii].arrayindex].t == 'I') {
					fprintf(fwptr,",%d", statarray[i][allusers[filen].showCols[ii].arrayindex].v );
				}
				else if (statarray[i][allusers[filen].showCols[ii].arrayindex].t == 'R' && statarray[i][allusers[filen].showCols[ii].arrayindex].w != 0) {

					fprintf(fwptr,",\"%d/%d\"", statarray[i][allusers[filen].showCols[ii].arrayindex].v,statarray[i][allusers[filen].showCols[ii].arrayindex].w );
				}
				else if (statarray[i][allusers[filen].showCols[ii].arrayindex].t == 'F') {
					fprintf(fwptr,",%s",outputF(statarray[i][allusers[filen].showCols[ii].arrayindex]).c_str());
				}
				else if (statarray[i][allusers[filen].showCols[ii].arrayindex].t == 'D') {
					fprintf(fwptr,",%s",outputDate(statarray[i][allusers[filen].showCols[ii].arrayindex]).c_str());
				}
				else if (statarray[i][allusers[filen].showCols[ii].arrayindex].t == 'B') {
					if (statarray[i][allusers[filen].showCols[ii].arrayindex].w == 1){
						fprintf(fwptr,",\"T\"");
					}
					else {
						fprintf(fwptr,",\"F\"");
					}
				}
				else {
					fprintf(fwptr,",-1");
				}
			}
			else {
				fprintf(fwptr,",-1");
			}
		}

		if (i+1 >= endRow){fprintf(fwptr,"]]");}
		else {fprintf(fwptr,"],");}

	}
	
	//Need to replace last , with ] if not enough elements -- or do in javascript
    fclose(fwptr);

   
	return 0;		//terminating function
}

/*
inline Cppdata solvePostfix(char exp[], Cppdata stack[], Cppdata const intArray[])
{

	int i;
  	int currentIndex = 0;
  	int arrayIndex = 0;

    for (i = 0; exp[i]; i++) 
    { 
        if (exp[i] == '#') {
        	stack[currentIndex] = intArray[arrayIndex];
        	currentIndex++;
        	arrayIndex++;
  
        } else 
        { 
            switch (exp[i]) 
            { 
	            case '>': stack[currentIndex - 2].w = (stack[currentIndex - 2] > stack[currentIndex - 1]) ? 1 : 0; stack[currentIndex - 2].t = 'B'; break; 
	            case '<': stack[currentIndex - 2].w = (stack[currentIndex - 2] < stack[currentIndex - 1]) ? 1 : 0; stack[currentIndex - 2].t = 'B'; break;
	            case ']': stack[currentIndex - 2].w = (stack[currentIndex - 2] >= stack[currentIndex - 1]) ? 1 : 0; stack[currentIndex - 2].t = 'B'; break; 
	            case '[': stack[currentIndex - 2].w = (stack[currentIndex - 2] <= stack[currentIndex - 1]) ? 1 : 0; stack[currentIndex - 2].t = 'B'; break;
	            case '+': stack[currentIndex - 2] = stack[currentIndex - 2] + stack[currentIndex - 1]; break; 
	            case '-': stack[currentIndex - 2] = stack[currentIndex - 2] - stack[currentIndex - 1]; break; 
	            case '*': stack[currentIndex - 2] = stack[currentIndex - 2] * stack[currentIndex - 1]; break; 
	            case '/': stack[currentIndex - 2] = stack[currentIndex - 2] / stack[currentIndex - 1]; break;
	            case '=': stack[currentIndex - 2] = stack[currentIndex - 2] == stack[currentIndex - 1]; break;
	            case '!': stack[currentIndex - 2] = stack[currentIndex - 2] != stack[currentIndex - 1]; break;
	            //case '%': stack[currentIndex - 2] = stack[currentIndex - 2] % stack[currentIndex - 1]; break; 
	            case '&': stack[currentIndex - 2].w = (stack[currentIndex - 2].w + stack[currentIndex - 1].w > 1) ? 1 : 0; stack[currentIndex - 2].t = (stack[currentIndex - 2].t == 'B' && stack[currentIndex - 1].t == 'B') ? 'B' : 'N'; break; 
	            case '|': stack[currentIndex - 2].w = (stack[currentIndex - 2].w + stack[currentIndex - 1].w == 0) ? 0 : 1; stack[currentIndex - 2].t = (stack[currentIndex - 2].t == 'B' && stack[currentIndex - 1].t == 'B') ? 'B' : 'N'; break; 
	            //multiandcase '&': if (stack[currentIndex - 5] > 0 && stack[currentIndex - 4] > 0 && stack[currentIndex - 3] > 0 && stack[currentIndex - 2] > 0 && stack[currentIndex - 1] > 0) {stack[currentIndex - 5] = 1;} else {stack[currentIndex - 5] = -1;}; currentIndex--; currentIndex--; currentIndex--; currentIndex--; break; 
            
            } 
            currentIndex--;
        } 
    } 



	return stack[0];

}
*/


Cppinstructions createInstructions(std::string basestr) {
	Cppinstructions ci; int i;
	std::vector<std::string> bothparts;
	bothparts = split(basestr,'@');
	
	std::string intstr = bothparts[0];
	std::vector<std::string> allints = split(intstr,'_');
	
	
	int stackSize = allints.size();
	ci.stack.resize(stackSize);
	ci.intArray.resize(stackSize);
	ci.ciStrArray.resize(stackSize);
	ci.caSize = 0;
	ci.colArray1.resize(0);
	ci.colArray2.resize(0);
	ci.casSize = 0;
	ci.colArray1s.resize(0);
	ci.colArray2s.resize(0);
	
	int stringmod = 0;
	for (i=0;i<stackSize;i++) {
		if (allints[i].c_str()[0] == 'c'){
			if (fast_atoi_col_nors(allints[i].c_str()) != 0) {
				ci.colArray1.push_back(i);
				ci.colArray2.push_back(fast_atoi_col(allints[i].c_str()));
				ci.caSize++;
			}
			else {
				if (stringmod%2 ==0){
					ci.colArray1s.push_back(i);
					ci.colArray2s.push_back(fast_atoi_col(allints[i].c_str()));
					ci.casSize++;
				}
				else {
					ci.colArray1s.push_back(-1*i);
					ci.colArray2s.push_back(fast_atoi_col(allints[i].c_str()));
					ci.casSize++;
					
				}
				
				stringmod++;
				ci.intArray[i].v = -1;
				ci.intArray[i].t = 'S';
			}
		}
		else {
			ci.intArray[i] = cppconstructor(allints[i].c_str());
			if (ci.intArray[i].t == 'S') {
				ci.intArray[i].v = 0;
				ci.ciStrArray[i] = allints[i];
				stringmod++;
			}
		}
	}
	
	
	
	strcpy(ci.exp,bothparts[1].c_str());
	ci.exp[bothparts[1].size()] = '\0';
	
	return ci;
}





