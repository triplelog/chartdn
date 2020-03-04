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

bool sortFilter = false;
std::vector<std::vector<int>> sortCol;
int vsize =0;
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
inline Cppdata RtoF(long num, int den, short shift) {
	Cppdata out = Cppdata(0);
	//std::cout << num << "," << den << "," << shift << ",";
	long tden = 200000000;
	tden *= den;
	int ii = 0;
	if (num >= tden && num >= -1*tden) {
		while (num >= tden && num >= -1*tden) {
			num /= 10;
			ii--;
		}
	}
	else {
		while (num < tden && num > -1*tden) {
			num *= 10;
			ii++;
		}
	}
	//std::cout << num << "," << den << "," ;
	out.v = num/den;
	//std::cout << out.v << "," << ii << std::endl;
	out.w = -1*ii+shift;
	out.t = 'F';
	return out;
}
struct Cppinstructions {
	std::vector<Cppdata> intArray;
	char exp[1000];
	int stackSize;
	std::vector<Cppdata> stack;
	std::vector<int> colArray1;
	std::vector<int> colArray2;
	int caSize;
	std::vector<std::string> ciStrArray;
	int casSize;
	std::vector<int> colArray1s;
	std::vector<int> colArray2s;
};
Cppdata Cppdata::operator+(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){ 
			if ((b.v > 0 && 2000000000 - b.v < v) || (b.v < 0 && -2000000000 - b.v > v)) {c.v = b.v/10 + v/10; c.w = 1; c.t = 'F';}
			else {c.v = b.v + v;}
			return c;
		}
		if (b.t == 'R'){
			long tv = v;
			tv *=b.w;
			tv += b.v;
			if (tv > 2000000000 || tv < -2000000000) {return RtoF(tv,b.w,0);}//Convert to Float logic.
			else {
				c.v = b.v + v*b.w;
			}
			return c;
		}
		if (b.t == 'F'){
			c.v = v; c.w = 0; c.t = 'F';
			return c+b;
		}
		if (b.t == 'D') {c.w += v; return c;}
	}
	if (t == 'R'){
		if (b.t == 'R'){
			int d = w*b.w;
			long n1 = b.v;
			n1 *= w;
			long n2 = v;
			n2 *= b.w;
			if (d > 30000 || n1+n2 > 2000000000 || n1+n2 < -2000000000){
				
				int g = std::gcd(w,b.w);
				int dg = d/g;
				long n3 = (n1+n2)/g;
				if (dg > 30000 || n3 > 2000000000 || n3 < -2000000000) {
					return RtoF(n3,dg,0);
				}
				else {
					c.v = n3;
					c.w = dg;
				}
			}
			else {
				c.v = n1+n2;
				c.w = d;
			}
			if (c.w == 1) {c.t = 'I';}
			return c;
		}
		if (b.t == 'I'){
			long tv = b.v;
			tv *=w;
			tv += v;
			if (tv > 2000000000 || tv < -2000000000) {return RtoF(tv,w,0);}
			else {
				c.v = b.v*w + v;
				c.w = w;
				c.t = 'R';
			}
			return c;
		}
		if (b.t == 'F'){
			return RtoF(v,w,0)+b;
		}
	}
	if (t == 'F'){
		if (b.t == 'F'){
			if (w == b.w) {
				if ((b.v > 0 && v  < 2000000000 - b.v) || (b.v < 0 && v > -2000000000 -b.v)){
					c.v = v + b.v;
					c.w = w;
				}
				else {
					c.v = v/10 + b.v/10;
					c.w = w+1;
				}
				return c;
			}
			long sv = b.v;
			short sw = b.w;
			long lv = v;
			short lw = w;
			if (w < b.w) {
				sv = v;
				sw = w;
				lv = b.v;
				lw = b.w;
			}
			while (lw > sw) {
				if (lv < 200000000 && lv > -200000000) {lv *= 10; lw--; }
				else {sv /= 10; sw++;}
			}
			if ((sv > 0 && lv < 2000000000 - sv) || (sv < 0 && lv > -2000000000 - sv)){
				c.v = lv + sv;
				c.w = sw;
			}
			else {
				c.v = (lv + sv)/10;
				c.w = sw+1;
			}
			return c;
		}
		else if (b.t == 'I') {
			c.v = v; c.w = w; c.t = 'F';
			Cppdata bb = b;
			bb.w = 0; bb.t = 'F';
			return c+bb;
		}
		else if (b.t == 'R') {
			c.v = v; c.w = w; c.t = 'F';
			return RtoF(b.v,b.w,0)+c;
		}
	}
	return c;
}

Cppdata Cppdata::operator-(Cppdata const &b)
{
	Cppdata c = b;
	c.v = v; c.w = w; c.t = t;
	Cppdata bb = b;
	if (b.t == 'I'){
		bb.v *= -1;
		return c+bb;
	}
	if (b.t == 'R'){
		bb.v *= -1;
		return c+bb;
	}
	if (b.t == 'F'){
		bb.v *= -1;
		return c+bb;
	}
	return c;
}
Cppdata Cppdata::operator*(Cppdata const &b)
{
	Cppdata c = b;
	if (t == 'I'){
		if (b.t == 'I'){
			long vbv = v;
			vbv *= b.v;
			if (vbv >2000000000){
				c.w = 0; c.t = 'F';
				while (vbv >2000000000){
					vbv /= 10;
					c.w++;
				}
				c.v = vbv;
			}
			else if (vbv < -2000000000) {
				c.w = 0; c.t = 'F';
				while (vbv < -2000000000){
					vbv /= 10;
					c.w++;
				}
				c.v = vbv;
			}
			else {c.v = vbv;}
			return c;
		}
		else if (b.t == 'R'){
			if (b.w==0) {c.v = v*b.v; c.w = 0; c.t='R'; return c;}
			long vbv = v;
			vbv *= b.v;
			if (vbv > 2000000000 || vbv < -2000000000){
				
				int g = std::gcd(vbv,b.w);
				int dg = b.w/g;
				long n3 = vbv/g;
				if (n3 > 2000000000 || n3 < -2000000000) {
					return RtoF(n3,dg,0);
				}
				else {
					c.v = n3;
					c.w = dg;
				}
			}
			else {
				c.v = vbv;
			}
			if (c.w == 1 && c.t == 'R') {c.t = 'I';}
			return c;
		}
		else if (b.t == 'F'){
			long vbv = v;
			vbv *= b.v;
			if (vbv >2000000000){
				while (vbv >2000000000){
					vbv /= 10;
					c.w++;
				}
				c.v = vbv;
			}
			else if (vbv < -2000000000) {
				while (vbv < -2000000000){
					vbv /= 10;
					c.w++;
				}
				c.v = vbv;
			}
			else {c.v = vbv;}
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
			if (b.v > 30000){return RtoF(v,b.v,0);}
			if (b.v < -30000){return RtoF(-1*v,-1*b.v,0);}
			if (b.v == 0) {c.v = v; c.w = 0; c.t = 'N'; return c;}
			if (v == 0) {c.v = 0; c.w = 1; c.t = 'I'; return c;}
			
			int gcd = std::gcd(v,b.v);
			c.v = v/gcd;
			c.w = b.v/gcd;
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
	if (t == 'S'){
		if (b.t == 'S'){
			if (v == b.v){
				c.w = 1;
				return c;
			}
			else {
				return c;
			}
		}
	}
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
	if (t == 'S'){
		if (b.t == 'S'){
			if (v != b.v){
				c.w = 1;
				return c;
			}
			else {
				return c;
			}
		}
	}
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
	if (a.t == 'S'){
		if (b.t == 'S'){
			return a.v > b.v;
		}
	}
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
	else if (a.t == 'B'){
		if (b.t == 'B'){
			return a.w > b.w;
		}
	}
	return false;
}
inline bool operator<(const Cppdata& a, const Cppdata& b)
{
	if (a.t == 'S'){
		if (b.t == 'S'){
			return a.v < b.v;
		}
	}
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
	else if (a.t == 'B'){
		if (b.t == 'B'){
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
inline bool operator<(const std::vector<Cppdata> a, const std::vector<Cppdata> b)
{
	if (sortFilter){
		if (a[0].w != 1) {return false;}
		if (b[0].w == 0) {return true;}
	}
	int i;
	for (i=vsize-1;i>-1;i--) {
		/*if (sortCol[i][0] == 0){
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) < 0) {return true;}
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) > 0) {return false;}
		}*/
		if (sortCol[i][0] == 0){
			if (a[sortCol[i][1]] > b[sortCol[i][1]]) {return true;}
			if (a[sortCol[i][1]] < b[sortCol[i][1]]) {return false;}
    	}
    	/*else if (sortCol[i][0] == 2){
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) > 0) {return true;}
			if (strarray[a[0].v][sortCol[i][1]].compare(strarray[b[0].v][sortCol[i][1]]) < 0) {return false;}
		}*/
		else {
			if (a[sortCol[i][1]] < b[sortCol[i][1]]) {return true;}
			if (a[sortCol[i][1]] > b[sortCol[i][1]]) {return false;}
    	}
    }
    return false;
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
	
	/*
	while (*x){
		val = val*10 + (*x - '0');
		x++;
	}
	return Cppdata(val);
	*/
	int i = 0; int ii = 0; int isn = 0;
	char a[50];
	
	
	int d = 0; char dtype = 'I'; int qcc = 0; 
	Cppdata out = Cppdata(0);
	if (*x == '\0') {return out;}
	//Trim whitespace
	while (*x){
		if (*x != ' ' && *x != '\t') {
			a[i] = *x;
			i++;
			if (dtype == 'I') {
				if (*x == '0' || *x == '1' || *x == '2' || *x == '3' || *x == '4' || *x == '5' || *x == '6' || *x == '7' || *x == '8' || *x == '9') {d++; if (out.v < 200000000) {out.v = out.v*10 + (*x - '0');} else {out.w++; out.t = 'F';} }
				else if (*x == '-' && out.v == 0 && isn == 0) {d++; isn = -1;}
				else if (*x == '/' && i == 1){dtype = 'd'; qcc = 1;}
				else if (*x == '/'){dtype = 'R'; qcc = 1;}
				else if (*x == '.'){dtype = 'F';}
			}
			else if (dtype == 'R') {
				if (*x == '/'){qcc++;}
			}
			ii = i;

		}
		else if (i> 0) {a[i] = *x; i++;}
		x++;
	}
	
	if (ii == 0){out.t = 'S'; out.v = 0; return out;}
	if (d == ii && dtype == 'I') {if (out.t == 'F') {out.w--;}; if (isn == -1) {out.v *= -1;}; return out;}
	
	if (dtype == 'R' && qcc >1) {if (qcc == 2) {dtype = 'D';} else {dtype = 'N';}}
	
	a[ii] = '\0';
	int qc; int osl; int iii = 0;
	char b[50];
	//Trim whitespace and quotation marks
	if (a[0] == '\"' && a[ii-1] == '\"') {
		bool chg = true; dtype = 'I';
		while (chg) {
			chg = false;
			qc = 0; i = 0; ii = 0; d = 0; isn = 0; out.v = 0; out.w = 1; out.t = 'I'; osl = 0; qcc = 0;
			for (iii = 0; a[iii] != '\0'; iii++){
				if (a[iii] == ' ' || a[iii] == '\t'){
					if (i == 0) {chg = true;}
					else {b[i] = a[iii]; i++;}
				}
				else {
					b[i] = a[iii];
					i++;
					if (a[iii] == '\"' && i >1) {if (qc == 0) {qc = i;} else {qc = -1;} }
					else if (a[iii] != '\"' && i == 1) {qc = -1;}
					if (dtype == 'I') {
						if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {d++; if (out.v < 200000000) {out.v = out.v*10 + (a[iii] - '0');} else {out.w++; out.t = 'F';} }
						else if (a[iii] == '-' && out.v == 0 && isn == 0) {d++; isn = -1;}
						else if (a[iii] == '/' && i == 1){dtype = 'd'; qcc = 1;}
						else if (a[iii] == '/'){dtype = 'R'; qcc = 1;}
						else if (a[iii] == '.'){dtype = 'F';}
					}
					else if (dtype == 'R') {
						if (a[iii] == '/' && i == 1){dtype = 'd'; qcc = 1;}
						else if (a[iii] == '/'){qcc++;}
					}
					ii = i;
				}
			}
			if (ii != i){chg = true;}
			if (ii == qc && ii > 0){b[0] = ' '; b[ii-1] = '\0'; chg = true;}
			else {b[ii] = '\0'; osl = ii;}
			for (iii = 0; b[iii] != '\0'; iii++){
				a[iii] = b[iii];
			}
			a[iii] = '\0';
		}
		if (osl < 1){out.t = 'S'; out.v = 0; return out;}
		else if (d == osl && dtype == 'I') {if (out.t == 'F') {out.w--;}; if (isn == -1) {out.v *= -1;}; return out;}
		if (d == 0 && dtype == 'I') {out.t = 'S'; out.v = 0; return out;}
		if (dtype == 'R' && qcc >1) {if (qcc == 2) {dtype = 'D';} else {dtype = 'N';}}
	}

	//Get fractions and decimals
	if (dtype == 'F'){
		qc = 0; qcc = 0; i = 0;ii = 0;d = 0; out.v = 0; out.w = 0; osl = 0; isn = 0;
		for (iii = 0; a[iii] != '\0'; iii++){
			if (a[iii] == '.'){ii = i; qcc++;}
			else {
				b[i] = a[iii];
				i++;
				if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {
					if (qcc == 0 && out.v < 200000000) {out.v = out.v*10 + (a[iii] - '0');} 
					else if (qcc == 0) {out.w++;}
					else if (out.v < 200000000) {out.v = out.v*10 + (a[iii] - '0'); out.w--;} //is the decimal part of float
					d++;
				}
				else if (a[iii] == '-' && out.v == 0 && isn == 0) {d++; isn = -1;}
			}
		}
		if (qcc == 1 && d == i) {
			out.t = 'F';
			if (isn == -1) {out.v *= -1;};
			return out;
		}
	}
	else if (dtype == 'R'){
		qc = 0; qcc = 0; i = 0;ii = 0;d = 0; out.v = 0; out.w = 0; osl = 0; isn = 0; long lv = 0; int lw = 0;
		for (iii = 0; a[iii] != '\0'; iii++){
			if (a[iii] == '/'){ii = i; qc++;}
			else {
				b[i] = a[iii];
				i++;
				if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {
					if (qc == 0 && lv < 200000000) {lv = lv*10 + (a[iii] - '0');} 
					else if (qc == 0 && lv < 2000000000000000) {dtype = 'F'; lv = lv*10 + (a[iii] - '0');} 
					else if (qc == 0) {out.w++;} 
					else if (qc == 1 && lw < 2000) {lw = lw*10 + (a[iii] - '0');}//is denominator
					else if (qc == 1 && lw < 200000000) {dtype = 'F'; lw = lw*10 + (a[iii] - '0');}//is denominator
					else if (qc == 1) {out.w--;}//is denominator--and too big?
					d++;
				}
				else if (a[iii] == '-' && lv == 0 && isn == 0) {d++; isn = -1;}
			}
		}
		if (qc == 1 && d == i && ii < i && ii > 0) {
			if (dtype == 'F') {out = RtoF(lv,lw,out.w); if (isn == -1) {out.v *= -1;}; return out; }
			else { if (lw != 1) {out.t = 'R'; out.v = lv; out.w = lw;} else {out.t = 'I'; out.v = lv; out.w = 1;}; if (isn == -1) {out.v *= -1;}; return out;}
		}
	}
	else if (dtype == 'D'){
		qc = 0; qcc = 0; i = 0;ii = 0;d = 0; out.v = 0; out.w = 0; osl = 0; isn = 0;
		for (iii = 0; a[iii] != '\0'; iii++){
			if (a[iii] == '/'){ii = i; qc++;}
			else {
				b[i] = a[iii];
				i++;
				if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {
					if (qc == 0 && out.v < 10) {out.v = out.v*10 + (a[iii] - '0');} 
					else if (qc == 0) {dtype = 'N';}
					else if (qc == 1 && out.w < 10) {out.w = out.w*10 + (a[iii] - '0');}//is denominator
					else if (qc == 1) {dtype = 'N';}
					else if (qc == 2 && osl < 1000) {osl = osl*10 + (a[iii] - '0');}
					else if (qc == 2) {dtype = 'N';}
					d++;
				}
			}
		}
		if (qc == 2 && d == i && ii < i && ii > 0) {
			if (out.v > 0 && out.w > 0 && osl > 0){
				return createDate(out.v,out.w,osl);
			}		
		}
	}
	else if (dtype == 'd'){
		qc = 0; qcc = 0; i = 0;ii = 0;d = 0; out.v = 0; out.w = 0; osl = 0; isn = 0;
		for (iii = 0; a[iii] != '\0'; iii++){
			if (a[iii] == '/'){ii = i; qcc++;}
			else {
				b[i] = a[iii];
				i++;
				if (a[iii] == '0' || a[iii] == '1' || a[iii] == '2' || a[iii] == '3' || a[iii] == '4' || a[iii] == '5' || a[iii] == '6' || a[iii] == '7' || a[iii] == '8' || a[iii] == '9') {
					if (out.w < 3000) {out.w = out.w*10 + (a[iii] - '0');} 
					d++;
				}
				else if (a[iii] == '-' && out.w == 0 && isn == 0) {d++; isn = -1;}
			}
		}
		if (qcc == 1 && d == i && ii < i) {if (isn == -1) {out.w *= -1;}; out.v = 0; out.t = 'D'; return out;}
	}
	
	b[i] = '\0';
	out.v = 0; out.w = 1;
	out.t = 'S'; out.v = 0; return out;
}
std::string outputDate(Cppdata x){
	int yeardiff = -24837; int i =1901;
	while (yeardiff <= x.w){
		i++;
		yeardiff += 365;
		if (i%4 == 0){
			yeardiff += 1;
		}
	}
	
	int year = i;
	yeardiff = (year - 1902) * 365 - 24837;
	yeardiff += (year - 1901) / 4;
	
	int dperm[] = {0,0,31,59,90,120,151,181,212,243,273,304,334,365};
	i = 0;
	int monthdiff = 0;
	do {
		i++;
		monthdiff = yeardiff+dperm[i];
		if (i>2 && (year %4 ==0)){monthdiff++;}
	} while (monthdiff <= x.w);
	int month = i-1;
	
	monthdiff = yeardiff+dperm[month];
	if (month>2 && (year %4 ==0)){monthdiff++;}
	
	int day = x.w - monthdiff+1;
	char buffer[20];
	sprintf(buffer,"\"%d/%d/%d\"",month,day,year);
	std::string outstr = buffer;
	return outstr;
}
std::string outputF(Cppdata x) {
	//int intpart = statarray[i][mtii].v / powersof10[-1*statarray[i][mtii].w];
   	//int fracpart = statarray[i][mtii].v - intpart * powersof10[-1*statarray[i][mtii].w];
   	int iii;
   	
   	
	char buffer[30] = {};
	
    if (x.w < 0){
		sprintf(buffer,"%d",x.v);
		int blen = strlen(buffer);
		if (blen+x.w>0){
			buffer[blen+1] = '\0';
			for (iii=blen-1;iii>=blen+x.w;iii--){
				buffer[iii+1] = buffer[iii];
			}
			buffer[blen+x.w] = '.';
		}
		else if (blen+x.w>=-3){
			buffer[blen+2-(blen+x.w)] = '\0';
			for (iii=blen-1;iii>=0;iii--){
				buffer[iii+2-(blen+x.w)] = buffer[iii];
			}
			for (iii=-1*(blen+x.w)+1;iii>=1;iii--){
				buffer[iii] = '0';
			}
			buffer[0] = '0';
			buffer[1] = '.';
		}
		else {
			char buffer2[blen+1] = {};
			buffer2[blen+1] = '\0';
			for (iii=blen-1;iii>=1;iii--){
				buffer2[iii+1] = buffer[iii];
			}
			buffer2[1] = '.';
			buffer2[0] = buffer[0];
			sprintf(buffer,"\"%se%d\"",buffer2,blen+x.w-1);
		}
	}
	else if (x.w > 0){
		int blen = strlen(buffer);
		char buffer2[blen+1] = {};
		buffer2[blen+1] = '\0';
		for (iii=blen-1;iii>=1;iii--){
			buffer2[iii+1] = buffer[iii];
		}
		buffer2[1] = '.';
		buffer2[0] = buffer[0];
		sprintf(buffer,"\"%se%d\"",buffer2,blen+x.w-1);
	}
	else {
   		sprintf(buffer,"%d",x.v);
   	}

   	std::string outstr = buffer;
	return outstr;
}
inline Cppdata solvePostfixVV(char expstr[], std::vector<Cppdata> const intArray, std::vector<Cppdata> stack)
{

	int i;
  	int currentIndex = 0;
  	int arrayIndex = 0;

    for (i = 0; expstr[i]; i++) 
    { 
        if (expstr[i] == '#') {
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


/*
inline int dl_distance(const char* p_string1, const char* p_string2)
{
    short l_string_length1 = strlen(p_string1);
    short l_string_length2 = strlen(p_string2);
    short d[l_string_length1+1][l_string_length2+1];

    short i;
    short j;
    short l_cost;
	d[0][0] = 0;
    for(j = 1; j<= l_string_length2; j++){
        d[0][j] = j;
    }
    for (i = 1;i <= l_string_length1;i++){
    	d[i][0] = i;
        for(j = 1; j<= l_string_length2; j++){
            l_cost = ( p_string1[i-1] == p_string2[j-1] ) ? 0 : 1;
            d[i][j] = std::min(d[i-1][j] + 1, std::min(d[i][j-1] + 1, d[i-1][j-1] + l_cost));
            if( (i > 1) && (j > 1) && (p_string1[i-1] == p_string2[j-2]) && (p_string1[i-2] == p_string2[j-1]) ) {
            	d[i][j] = (d[i][j] <= d[i-2][j-2] + l_cost) ? d[i][j] : d[i-2][j-2] + l_cost;
            }
        }
    }
    return d[l_string_length1][l_string_length2];
}
int my_distance(const char* p_string1, const char* p_string2)
{
    short l_string_length1 = strlen(p_string1);
    short l_string_length2 = strlen(p_string2);

    short i;
    short j;
    short l_cost = 0;
    for(j = 0; j< l_string_length1; j++){
        for (i = 0;i < l_string_length2;i++){ 
        	if (p_string1[j] == p_string2[i]){
        		l_cost++;
        	}
    	}
    }
    return l_cost;
}

int fast_dl_distance(std::string s, std::string t) {
	int maxDistance = 4;
    if (s.length() < 1) return maxDistance + 1;
    if (t.length() < 1) return maxDistance + 1;
 
    int sLen = s.length(); // this is also the minimun length of the two strings
    int tLen = t.length();
 
    // suffix common to both strings can be ignored
    while ((sLen > 0) && (s[sLen - 1] == t[tLen - 1])) { sLen--; tLen--; }
 
    int start = 0;
    
    if ((s[0] == t[0]) || (sLen == 0)) { // if there's a shared prefix, or all s matches t's suffix
        // prefix common to both strings can be ignored
        while ((start < sLen) && (s[start] == t[start])) start++;
        sLen -= start; // length of the part excluding common prefix and suffix
        tLen -= start;
 
        // if all of shorter string matches prefix and/or suffix of longer string, then
        // edit distance is just the delete of additional characters present in longer string
        if (sLen == 0) return (tLen <= maxDistance) ? tLen : -1;
 
        //t = t.Substring(start, tLen); // faster than t[start+j] in inner loop below
    }
    
    int lenDiff = tLen - sLen;
    if ((maxDistance < 0) || (maxDistance > tLen)) {
        maxDistance = tLen;
    } else if (lenDiff > maxDistance) return maxDistance + 1;
 
    int v0[tLen];
    int v2[tLen]; // stores one level further back (offset by +1 position)
    int j;
    for (j = 0; j < maxDistance; j++) v0[j] = j + 1;
    for (; j < tLen; j++) v0[j] = maxDistance + 1;
 
    int jStartOffset = maxDistance - (tLen - sLen);
    bool haveMax = maxDistance < tLen;
    int jStart = 0;
    int jEnd = maxDistance;
    char sChar = s[0];
    int current = 0;
    for (int i = 0; i < sLen; i++) {
        char prevsChar = sChar;
        sChar = s[start + i];
        char tChar = t[0];
        int left = i;
        current = left + 1;
        int nextTransCost = 0;
        // no need to look beyond window of lower right diagonal - maxDistance cells (lower right diag is i - lenDiff)
        // and the upper left diagonal + maxDistance cells (upper left is i)
        jStart += (i > jStartOffset) ? 1 : 0;
        jEnd += (jEnd < tLen) ? 1 : 0;
        for (j = jStart; j < jEnd; j++) {
            int above = current;
            int thisTransCost = nextTransCost;
            nextTransCost = v2[j];
            v2[j] = current = left; // cost of diagonal (substitution)
            left = v0[j];    // left now equals current cost (which will be diagonal at next iteration)
            char prevtChar = tChar;
            tChar = t[j];
            if (sChar != tChar) {
                if (left < current) current = left;   // insertion
                if (above < current) current = above; // deletion
                current++;
                if ((i != 0) && (j != 0)
                    && (sChar == prevtChar)
                    && (prevsChar == tChar)) {
                    thisTransCost++;
                    if (thisTransCost < current) current = thisTransCost; // transposition
                }
            }
            v0[j] = current;
        }
        if (haveMax && (v0[i + lenDiff] > maxDistance)) return maxDistance + 1;
    }
    return (current <= maxDistance) ? current : maxDistance + 1;
}

int dl_distance_stream(const char* p_string1, const char* p_string2, std::vector<std::vector<short>> d)
{
	short l_string_length1 = strlen(p_string1);
    short l_string_length2 = strlen(p_string2);
    short dsize = d.size(); short i;
    if (dsize < l_string_length1+1){
    	d.resize(l_string_length1+1);
    	for (i =dsize; i< l_string_length1+1;i++){
    		d[i].resize(l_string_length2+1);
    	}
    }

    
    short j;
    short l_cost;
	d[0][0] = 0;
    for(j = 1; j<= l_string_length2; j++){
        d[0][j] = j;
    }
    for (i = 1;i <= l_string_length1;i++){
    	d[i][0] = i;
        for(j = 1; j<= l_string_length2; j++){
            l_cost = ( p_string1[i-1] == p_string2[j-1] ) ? 0 : 1;
            d[i][j] = std::min(d[i-1][j] + 1, std::min(d[i][j-1] + 1, d[i-1][j-1] + l_cost));
            if( (i > 1) && (j > 1) && (p_string1[i-1] == p_string2[j-2]) && (p_string1[i-2] == p_string2[j-1]) ) {
            	d[i][j] = (d[i][j] <= d[i-2][j-2] + l_cost) ? d[i][j] : d[i-2][j-2] + l_cost;
            }
        }
    }
    return d[l_string_length1][l_string_length2];

}
const double JARO_WEIGHT_STRING_A(1.0/3.0);
const double JARO_WEIGHT_STRING_B(1.0/3.0);
const double JARO_WEIGHT_TRANSPOSITIONS(1.0/3.0);

const unsigned long int JARO_WINKLER_PREFIX_SIZE(4);
const double JARO_WINKLER_SCALING_FACTOR(0.1);
const double JARO_WINKLER_BOOST_THRESHOLD(0.7);
double jaro(const std::string& a, const std::string& b)
{
    // Register strings length.
    int aLength(a.size());
    int bLength(b.size());
    
    // If one string has null length, we return 0.
    if (aLength == 0 || bLength == 0)
    {
        return 0.0;
    }
    
    // Calculate max length range.
    int maxRange(std::max(0, std::max(aLength, bLength) / 2 - 1));
    
    // Creates 2 vectors of integers.
    std::vector<bool> aMatch(aLength, false);
    std::vector<bool> bMatch(bLength, false);
    
    // Calculate matching characters.
    int matchingCharacters(0);
    for (int aIndex(0); aIndex < aLength; ++aIndex)
    {
        // Calculate window test limits (limit inferior to 0 and superior to bLength).
        int minIndex(std::max(aIndex - maxRange, 0));
        int maxIndex(std::min(aIndex + maxRange + 1, bLength));
        
        if (minIndex >= maxIndex)
        {
            // No more common character because we don't have characters in b to test with characters in a.
            break;
        }
        
        for (int bIndex(minIndex); bIndex < maxIndex; ++bIndex)
        {
            if (!bMatch.at(bIndex) && a.at(aIndex) == b.at(bIndex))
            {
                // Found some new match.
                aMatch[aIndex] = true;
                bMatch[bIndex] = true;
                ++matchingCharacters;
                break;
            }
        }
    }
    
    // If no matching characters, we return 0.
    if (matchingCharacters == 0)
    {
        return 0.0;
    }
    
    // Calculate character transpositions.
    std::vector<int> aPosition(matchingCharacters, 0);
    std::vector<int> bPosition(matchingCharacters, 0);
    
    for (int aIndex(0), positionIndex(0); aIndex < aLength; ++aIndex)
    {
        if (aMatch.at(aIndex))
        {
            aPosition[positionIndex] = aIndex;
            ++positionIndex;
        }
    }
    
    for (int bIndex(0), positionIndex(0); bIndex < bLength; ++bIndex)
    {
        if (bMatch.at(bIndex))
        {
            bPosition[positionIndex] = bIndex;
            ++positionIndex;
        }
    }
    
    // Counting half-transpositions.
    int transpositions(0);
    for (int index(0); index < matchingCharacters; ++index)
    {
        if (a.at(aPosition.at(index)) != b.at(bPosition.at(index)))
        {
            ++transpositions;
        }
    }
    
    // Calculate Jaro distance.
    return (
        JARO_WEIGHT_STRING_A * matchingCharacters / aLength +
        JARO_WEIGHT_STRING_B * matchingCharacters / bLength +
        JARO_WEIGHT_TRANSPOSITIONS * (matchingCharacters - transpositions / 2) / matchingCharacters
    );
}
*/