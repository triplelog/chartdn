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
using phmap::flat_hash_map;

struct Cppdata {
	int v = 1;
	short w = 1;
	char t = 'I';
	Cppdata() {};
	explicit Cppdata(int i) : v(i), w(1), t('I') {};
	explicit Cppdata(int i, int j, char k) : v(i), w(j), t('R') {};
	inline Cppdata operator+(Cppdata const &b);
	inline Cppdata operator-(Cppdata const &b);
	inline Cppdata operator*(Cppdata const &b);
	inline Cppdata operator/(Cppdata const &b);
	inline Cppdata operator==(Cppdata const &b);
	inline Cppdata operator!=(Cppdata const &b);
	//inline Cppdata operator+=(Cppdata const &b);
};

struct Cppinstructions {
	std::vector<Cppdata> intArray;
	char exp[1000];
	int stackSize;
	std::vector<Cppdata> stack;
	std::vector<int> colArray1;
	std::vector<int> colArray2;
	int caSize;
};
Cppdata Cppdata::operator+(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){ 
			if (2000000000 - b.v < v || -2000000000 - b.v > v) {c.v = b.v/10 + v/10; c.w = 1; c.t = 'F';}
			else {c.v = b.v + v;}
			return c;
		}
		if (b.t == 'R'){
			if (2000000000/b.w < v || -2000000000/b.w > v) {c.t = 'F';}//Convert to Float logic.
			else if (2000000000 - b.v < v*b.w || -2000000000 - b.v > v*b.w) {c.v = b.v/10 + v*b.w/10; c.w = 1; c.t = 'F';}
			else {c.v = b.v + v*b.w;}
			return c;
		}
		if (b.t == 'F'){
			if (b.w < 0) {
				c.v = v;
				int tw = b.w;
				int tv = b.v;
				while (tw < 0) {
					if (c.v < 100000000 && c.v > -100000000) {c.v *= 10; tw++;}
					else {tv /= 10; c.w++; tw++;}
				}
				c.v += tv;
			}
			else if (b.w > 0) {
				c.v = v;
				int tw = b.w;
				int tv = b.v;
				while (tw > 0) {
					if (tv < 100000000 && tv > -100000000) {tv *= 10; c.w--; tw--;}
					else {c.v /= 10; tw--;}
				}
				c.v += tv;
			}
			else {c.v = b.v + v;}
			if (c.w == 0) {c.t = 'I';}
			return c;
		}
		if (b.t == 'D') {c.w += v; return c;}
	}
	if (t == 'R'){
		if (b.t == 'R'){
			c.v = (b.v*w + v*b.w)/std::gcd(w,b.w);
			c.w = std::lcm(w,b.w);
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		if (b.t == 'I'){
			c.v = b.v*w + v;
			c.w = w;
			c.t = 'R';
			return c;
		}
	}
	if (t == 'S'){
		if (b.t == 'S'){
			if (w > b.w) {
				long newv = b.v;
				short neww = b.w;
				do {
					newv /= 32;
					neww++;
				} while (w > neww && neww < b.w + 6);
				if (neww == b.w + 6) {c.v = v; c.w = w; return c;}
				c.v = v + newv;
				c.w = neww;
				if (c.v >= 32) {
					c.w++;
					c.v /= 32;
				}
			}
			else if (w < b.w) {
				long newv = v;
				short neww = w;
				do {
					newv /= 32;
					neww++;
				} while (b.w > neww && neww < w + 6);
				if (neww == w + 6) {c.v = b.v; c.w = b.w; return c;}
				c.v = b.v + newv;
				c.w = neww;
				if (c.v >= 32) {
					c.w++;
					c.v /= 32;
				}
			}
			else {
				c.v = v + b.v;
				if (c.v >= 32) {
					c.w++;
					c.v /= 32;
				}
			}
			return c;
		}
	}
	return c;
}

Cppdata Cppdata::operator-(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){
			c.v = v - b.v;
			return c;
		}
		if (b.t == 'R'){
			c.v = v*b.w - b.v;
			return c;
		}
	}
	if (t == 'R'){
		if (b.t == 'R'){
			c.v = (v*b.w - b.v*w)/std::gcd(w,b.w);
			c.w = std::lcm(w,b.w);
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		if (b.t == 'I'){
			c.v = v - b.v*w;
			c.w = w;
			c.t = 'R';
			return c;
		}
	}
	return c;
}
Cppdata Cppdata::operator*(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){c.v = v * b.v; return c;}
		else if (b.t == 'R'){
			if (b.w==0) {c.v = v*b.v; c.w = 0; c.t='R'; return c;}
			c.v = (v*b.v)/std::gcd(v*b.v,b.w);
			c.w = b.w/std::gcd(v*b.v,b.w);
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		else if (b.t == 'B'){c.w = w; c.t = t; c.v = v*b.w;  return c;}
	}
	else if (t == 'R'){
		if (b.t == 'R'){
			c.v = (v*b.v);
			c.w = (w*b.w);
			if (c.v == 0) {c.w = 1; c.t = 'I'; return c;}
			int gcd = std::gcd(c.v,c.w);
			c.v /= gcd;
			c.w /= gcd;
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		else if (b.t == 'I'){
			if (w==0) {c.v = v*b.v; c.w = 0; c.t='R'; return c;}
			c.v = (v*b.v)/std::gcd(v*b.v,w);
			c.w = w/std::gcd(v*b.v,w);
			if (c.w == 1) {c.t = 'I';}
			else {c.t = 'R';}			
			return c;
		}
		else if (b.t == 'B'){c.w = w; c.t = t; c.v = v*b.w;  return c;}
	}
	else if (t == 'B'){c.v = w*b.v;  return c;}
	return c;
}
Cppdata Cppdata::operator/(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){
			if (b.v != 0 && v % b.v == 0) {c.v = v/b.v; return c;}
			c.v = v * b.w;
			c.w = w * b.v;
			if (c.v == 0) {c.w = 1; c.t = 'I'; return c;}
			if (c.w == 0) {c.t = 'N'; return c;}
			int gcd = std::gcd(c.v,c.w);
			c.v /= gcd;
			c.w /= gcd;
			if (c.w != 1) {c.t = 'R';}
			return c;
		}
		else if (b.t == 'R'){
			c.v = v * b.w;
			c.w = b.v;
			if (c.v == 0) {c.w = 1; c.t = 'I'; return c;}
			if (c.w == 0) {c.t = 'N'; return c;}
			int gcd = std::gcd(c.v,c.w);
			c.v /= gcd;
			c.w /= gcd;
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
	}
	else if (t == 'R'){
		if (b.t == 'R'){
			c.v = v * b.w;
			c.w = w * b.v;
			if (c.v == 0) {c.w = 1; c.t = 'I'; return c;}
			if (c.w == 0) {c.t = 'N'; return c;}
			int gcd = std::gcd(c.v,c.w);
			c.v /= gcd;
			c.w /= gcd;
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		else if (b.t == 'I'){
			c.v = v;
			c.w = w * b.v;
			if (c.v == 0) {c.w = 1; c.t = 'I'; return c;}
			if (c.w == 0) {c.t = 'N'; return c;}
			int gcd = std::gcd(c.v,c.w);
			c.v /= gcd;
			c.w /= gcd;
			if (c.w != 1) {c.t = 'R';}
			return c;
		}
	}
	return c;
}
Cppdata Cppdata::operator==(Cppdata const &b)
{
	Cppdata c = b;
	c.t = 'B';
	c.w = 0;
	if (t == 'I'){
		if (b.t == 'I'){
			if (v == b.v){
				c.w = 1;
			}
			else {
				c.w = 0;
			}
			return c;
		}
		else if (b.t == 'R'){
			if (v * b.w == b.v ){
				c.w = 1;
			}
			else {
				c.w = 0;
			}
			return c;
		}
	}
	else if (t == 'R'){
		if (b.t == 'R'){
			if (v * b.w == b.v * w){
				c.w = 1;
			}
			else {
				c.w = 0;
			}
			return c;
		}
		else if (b.t == 'I'){
			if (v == b.v * w){
				c.w = 1;
			}
			else {
				c.w = 0;
			}
			return c;
		}
	}
	else if (t == 'B'){
		if (b.t == 'B'){
			if (w == b.w){
				c.w = 1;
			}
			else {
				c.w = 0;
			}
			return c;
		}
	}
	return c;
}
Cppdata Cppdata::operator!=(Cppdata const &b)
{
	Cppdata c = b;
	c.t = 'B';
	c.w = 1;
	if (t == 'I'){
		if (b.t == 'I'){
			if (v == b.v){
				c.w = 0;
			}
			else {
				c.w = 1;
			}
			return c;
		}
		else if (b.t == 'R'){
			if (v * b.w == b.v ){
				c.w = 0;
			}
			else {
				c.w = 1;
			}
			return c;
		}
	}
	else if (t == 'R'){
		if (b.t == 'R'){
			if (v * b.w == b.v * w){
				c.w = 0;
			}
			else {
				c.w = 1;
			}
			return c;
		}
		else if (b.t == 'I'){
			if (v == b.v * w){
				c.w = 0;
			}
			else {
				c.w = 1;
			}
			return c;
		}
	}
	else if (t == 'B'){
		if (b.t == 'B'){
			if (w == b.w){
				c.w = 0;
			}
			else {
				c.w = 1;
			}
			return c;
		}
	}
	return c;
}
inline bool operator>(const Cppdata& a, const Cppdata& b)
{
    if (a.t == 'I'){
		if (b.t == 'I'){
			return a.v > b.v;
		}
		else if (b.t == 'R'){
			return a.v * b.w > b.v;
		}
		else if (b.t == 'F'){
			return a.v > b.v * pow(10,b.w);
		}
	}
	else if (a.t == 'R'){
		if (b.t == 'I'){
			return a.v > b.v * a.w;
		}
		else if (b.t == 'R'){
			return a.v * b.w > b.v * a.w;
		}
		else if (b.t == 'F'){
			return a.v > b.v * pow(10,b.w) * a.w;
		}
	}
	else if (a.t == 'F'){
		if (b.t == 'I'){
			return a.v * pow(10,a.w) > b.v;
		}
		else if (b.t == 'R'){
			return a.v * pow(10,a.w) * b.w > b.v;
		}
		else if (b.t == 'F'){
			return a.v * pow(10,a.w-b.w) > b.v;
		}
	}
	else if (a.t == 'D'){
		if (b.t == 'D'){
			return a.w > b.w;
		}
	}
	return false;
}
inline bool operator<(const Cppdata& a, const Cppdata& b)
{
    if (a.t == 'I'){
		if (b.t == 'I'){
			return a.v < b.v;
		}
		else if (b.t == 'R'){
			return a.v * b.w < b.v;
		}
		else if (b.t == 'F'){
			return a.v < b.v * pow(10,b.w);
		}
	}
	else if (a.t == 'R'){
		if (b.t == 'I'){
			return a.v < b.v * a.w;
		}
		else if (b.t == 'R'){
			return a.v * b.w < b.v * a.w;
		}
		else if (b.t == 'F'){
			return a.v < b.v * pow(10,b.w) * a.w;
		}
	}
	else if (a.t == 'F'){
		if (b.t == 'I'){
			return a.v * pow(10,a.w) < b.v;
		}
		else if (b.t == 'R'){
			return a.v * pow(10,a.w) * b.w < b.v;
		}
		else if (b.t == 'F'){
			return a.v * pow(10,a.w-b.w) < b.v;
		}
	}
	else if (a.t == 'D'){
		if (b.t == 'D'){
			return a.w < b.w;
		}
	}
	return false;
}
inline bool operator<=(const Cppdata& a, const Cppdata& b)
{
    if (a > b){ return false; }
	return true;
}
inline bool operator>=(const Cppdata& a, const Cppdata& b)
{
    if (a < b){ return false; }
	return true;
}
inline Cppdata createDate(int m, int d, int y){
	Cppdata out = Cppdata(0);
	out.t = 'D';
	out.v = 0;
	if (y > 1969){
		int yeardiff = (y - 1970) * 365;
		yeardiff += (y - 1969) / 4;
		int dperm[] = {0,0,31,59,90,120,151,181,212,243,273,304,334};
		yeardiff += dperm[m];
		if (m>2 && (y %4 ==0)){yeardiff++;}
		yeardiff += d-1;
		out.w = yeardiff;
	}
	else {
		int yeardiff = (y - 1902) * 365;
		yeardiff += (y - 1901) / 4;
		int dperm[] = {0,0,31,59,90,120,151,181,212,243,273,304,334};
		yeardiff += dperm[m];
		if (m>2 && (y %4 ==0)){yeardiff++;}
		yeardiff += d-1;
		out.w = yeardiff - 24837;
	}
	return out;
}
inline Cppdata cppconstructor(const char* x) {
	int i = 0; int ii = 0; int iii = 0; int qc = 0; int qcc = 0; int osl = 0; int isn = 0;
	char a[20];
	char b[20];
	bool chg = true;
	int d = 0;
	int val = 0;
	Cppdata out = Cppdata(0);
	if (*x == '\0') {return out;}
	//Trim whitespace and remove unneeded parentheses
	while (*x){
		if (i == 0 && *x == ' '){}
		else if (i == 0 && *x == '\t'){}
		else {
			a[i] = *x;
			i++;
			if (*x == ' ' || *x == '\t'){
			}
			else {
				if (*x == '0' || *x == '1' || *x == '2' || *x == '3' || *x == '4' || *x == '5' || *x == '6' || *x == '7' || *x == '8' || *x == '9') {d++; val = val*10 + (*x - '0');}
				else if (*x == '-' && val == 0 && isn == 0) {d++; isn = -1;}
				ii = i;
			}
		}
		x++;
	}
	
	if (ii == 0){return out;}
	else if (d == ii) {out.v = val; if (isn == -1) {out.v *= -1;}; return out;}
	a[ii] = '\0';
	
	
	//Trim whitespace and quotation marks
	do {
		chg = false;
		qc = 0; i = 0; ii = 0; d = 0; val = 0; isn = 0;
		for (iii = 0; a[iii] != '\0'; iii++){
			if (i == 0 && a[iii] == ' '){chg = true;}
			else if (i == 0 && a[iii] == '\t'){chg = true;}
			else {
				b[i] = a[iii];
				i++;
				if (a[iii] == ' ' || a[iii] == '\t'){
				}
				else {
					if (a[iii] == '\"' && i >1 && qc == 0) {qc = i;}
					else if (a[iii] == '\"' && i >1) {qc = -1;}
					else if (a[iii] != '\"' && i == 1) {qc = -1;}
					if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {d++; val = val*10 + (a[iii] - '0');}
					else if (a[iii] == '-' && val == 0 && isn == 0) {d++; isn = -1;}
					ii = i; 
				}
			
			}
		}
		if (ii != i){chg = true;}
		if (ii == qc && ii > 0){b[0] = ' '; b[ii-1] = '\0'; chg = true;}
		else {b[ii] = '\0'; osl = ii;}
		for (iii = 0; b[iii] != '\0'; iii++){
			a[iii] = b[iii];
		}
		a[iii] = b[iii];
	} while (chg);
	
	
	if (osl < 1){return out;}
	else if (d == osl) {out.v = val; if (isn == -1) {std::cout << "b" << std::endl; out.v *= -1;}; return out;}
	if (d == 0) {return out;}

	
	//Get fractions and decimals

	qc = 0; qcc = 0; i = 0;ii = 0;d = 0; out.v = 0; out.w = 0; osl = 0; isn = 0;
	for (iii = 0; a[iii] != '\0'; iii++){
		if (a[iii] == '/'){ii = i; qc++;}
		else if (a[iii] == '.'){ii = i; qcc++;}
		else {
			b[i] = a[iii];
			i++;
			if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {
				if (qc == 0 && qcc == 0 && out.v < 100000000) {out.v = out.v*10 + (a[iii] - '0');}
				else if (qc == 0 && qcc == 0) {out.w++;}
				else if (qc == 0 && out.v < 100000000) {out.v = out.v*10 + (a[iii] - '0'); out.w--;}
				else if (qc == 0) {}//No more decimal digits
				else if (qc == 1) {out.w = out.w*10 + (a[iii] - '0');}//what if too big?
				else if (qc == 2) {osl = osl*10 + (a[iii] - '0');}
				d++;
			}
			else if (a[iii] == '-' && out.v == 0 && isn == 0) {d++; isn = -1;}
		}
	}
	
	if (qc == 1 && qcc == 0 && d == i && ii < i && ii > 0) {if (out.w != 1) {out.t = 'R';}; if (isn == -1) {out.v *= -1;}; return out;}
	else if (qc == 1 && qcc == 0 && d == i && ii < i) {out.v = 0; out.t = 'D'; return out;}
	else if (qc == 0 && qcc == 1 && d == i) {
		out.t = 'F';
		if (isn == -1) {out.v *= -1;};
		return out;
	}
	else if (qc == 2 && qcc == 0 && d == i && ii < i && ii > 0) {
		if (out.v > 0 && out.w > 0 && osl > 0){
			return createDate(out.v,out.w,osl);
		}		
	}
	b[i] = '\0';
	out.v = 0; out.w = 1;
	return out;
}
inline char* outputDate(Cppdata x){
	int yeardiff = -24837; int i =1901;
	while (yeardiff < x.w){
		i++;
		yeardiff += 365;
		if (i%4 == 0){
			yeardiff += 1;
		}
	}
	
	int year = i;
	yeardiff = (year - 1902) * 365;
	yeardiff += (year - 1901) / 4;
	
	int dperm[] = {0,0,31,59,90,120,151,181,212,243,273,304,334};
	i = 0;
	int monthdiff = 0;
	while (monthdiff < x.w){
		i++;
		monthdiff = yeardiff+dperm[i];
		if (i>2 && (year %4 ==0)){monthdiff++;}
	}
	int month = i-1;
	
	monthdiff = yeardiff+dperm[month];
	if (month>2 && (year %4 ==0)){monthdiff++;}
	
	int day = x.w - monthdiff+1;
	char buffer[20];
	sprintf(buffer,"\"%d/%d/%d\"",month,day,year);
	char* out = buffer;
	return out;
}
inline char* outputF(Cppdata x) {
	//int intpart = statarray[i][mtii].v / powersof10[-1*statarray[i][mtii].w];
   	//int fracpart = statarray[i][mtii].v - intpart * powersof10[-1*statarray[i][mtii].w];
   	int iii;
   	
	char buffer[30];
	
    if (x.w < 0){
		sprintf(buffer,"%d",x.v);
		int blen = strlen(buffer);
		buffer[blen+1] = '\0';
		for (iii=blen-1;iii>=blen+x.w;iii--){
			buffer[iii+1] = buffer[iii];
		}
		buffer[blen+x.w] = '.';
	}
	else if (x.w > 0){
		sprintf(buffer,"\"%de%d\"",x.v,x.w);
	}
	else {
   		sprintf(buffer,"%d",x.v);
   	}
   	char* out = buffer;
	return out;
}
inline Cppdata solvePostfixV(char exp[], std::vector<Cppdata> stack, std::vector<Cppdata> const intArray)
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