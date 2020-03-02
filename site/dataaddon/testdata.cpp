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
#include <assert.h>
#include <random>
#include "parallel_hashmap/phmap.h"
//#include "lz4.h"
//#include <boost/accumulators/statistics/covariance.hpp>
//#include <boost/accumulators/statistics/variates/covariate.hpp>
//#include <boost/integer/common_factor_rt.hpp> works but no improvement seen for lcm in small test
//#include <boost/sort/pdqsort/pdqsort.hpp>
#include "parser.hpp"
#include "cppdatatemp.hpp"

unsigned int now; unsigned int start;
std::random_device dev;
std::mt19937_64 rng(dev());
std::uniform_int_distribution<long> dist6(-5000000000,5000000000);

int loadints() {
	std::vector<std::string> a, b;
	std::vector<long> c, d;
	int i;
	long ia, ib;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = dist6(rng);
		ib = dist6(rng);
		ias = " " + std::to_string(ia) + " ";
		ibs = " \"\t" + std::to_string(ib) + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		if (c[i] < 2000000000 && c[i] > -2000000000){assert(cppa.v  == c[i] && cppa.t == 'I');} 
		else {assert(cppa.v  < c[i]/10 +2 && cppa.v  > c[i]/10 - 2 && cppa.w == 1 && cppa.t == 'F');}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 ints: "<< now - start << ", ";
    start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<10000000;i++) {
		cppb = cppconstructor(b[i].c_str());
		if (d[i] < 2000000000 && d[i] > -2000000000){assert(cppb.v  == d[i] && cppb.t == 'I');} 
		else {assert(cppb.v  < d[i]/10 +2 && cppb.v  > d[i]/10 - 2 && cppb.w == 1 && cppb.t == 'F');}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 ints (w/ q): "<< now - start << std::endl;
	return 0;
}

int loadrationals() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e, f;
	int i;
	long ia, ib, ic, id;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = dist6(rng);
		ib = dist6(rng);
		ic = abs(dist6(rng)) % 100 + 1;
		id = abs(dist6(rng)) % 100 + 1;
		ias = " " + std::to_string(ia)+ "/" + std::to_string(ic) + " ";
		ibs = " \"" + std::to_string(ib)+ "/" + std::to_string(id)  + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
		e.push_back(ic);
		f.push_back(id);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		if (c[i] < 2000000000 && c[i] > -2000000000 && e[i] == 1){assert(cppa.t == 'I' && c[i] == cppa.v);} 
		else if (c[i] < 2000000000 && c[i] > -2000000000 && e[i] < 20000 && e[i] > -20000){assert(cppa.t == 'R' && c[i]*cppa.w == e[i]*cppa.v);} 
		else {assert(cppa.t == 'F');}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 rationals: "<< now - start << ", ";
    start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<10000000;i++) {
		cppb = cppconstructor(b[i].c_str());
		if (d[i] < 2000000000 && d[i] > -2000000000 && f[i] == 1){assert(cppb.t == 'I');} 
		else if (d[i] < 2000000000 && d[i] > -2000000000 && f[i] < 20000 && f[i] > -20000){assert(cppb.t == 'R' && d[i]*cppb.w == f[i]*cppb.v);} 
		else {assert(cppb.t == 'F');}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 rationals (w/ q): "<< now - start << std::endl;
	return 0;
}

int loadfloats() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e, f;
	int i;
	long ia, ib, ic, id;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<5000000;i++) {
		ia = dist6(rng);
		ib = dist6(rng);
		ic = abs(dist6(rng)) % 1000 + 1;
		id = abs(dist6(rng)) % 1000 + 1;
		ias = " " + std::to_string(ia)+ "." + std::to_string(ic) + " ";
		ibs = " \"" + std::to_string(ib)+ "." + std::to_string(id)  + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
		e.push_back(ic);
		f.push_back(id);
	}
	for (i=0;i<5000000;i++) {
		ia = dist6(rng) % 10000 + 1;
		ib = dist6(rng) % 10000 + 1;
		ic = abs(dist6(rng));
		id = abs(dist6(rng));
		ias = " " + std::to_string(ia)+ "." + std::to_string(ic) + " ";
		ibs = " \"" + std::to_string(ib)+ "." + std::to_string(id)  + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
		e.push_back(ic);
		f.push_back(id);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	int ii;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		//std::cout << cppa.v << "," << c[i] << "," << cppa.w << "," << e[i] << std::endl;
		if (cppa.w < 0){
			for (ii=0;ii>cppa.w;ii--){
				cppa.v /= 10;
			}
		}
		else if (cppa.w > 0){
			for (ii=0;ii<cppa.w;ii++){
				c[i] /= 10;
			}
		}
		assert(cppa.t == 'F' && cppa.v < c[i]+10 && cppa.v > c[i] - 10);
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 floats: "<< now - start << ", ";
    start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<10000000;i++) {
		cppb = cppconstructor(b[i].c_str());
		//std::cout << cppa.v << "," << c[i] << "," << cppa.w << "," << e[i] << std::endl;
		if (cppb.w < 0){
			for (ii=0;ii>cppb.w;ii--){
				cppb.v /= 10;
			}
		}
		else if (cppb.w > 0){
			for (ii=0;ii<cppb.w;ii++){
				d[i] /= 10;
			}
		}
		assert(cppb.t == 'F' && cppb.v < d[i]+10 && cppb.v > d[i] - 10);
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 floats (w/ q): "<< now - start << std::endl;
	return 0;
}

int loaddates1() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e, f, g, h;
	int i;
	long ia, ib, ic, id, ie, ig;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = abs(dist6(rng)) % 12 + 1;
		ib = abs(dist6(rng)) % 12 + 1;
		ic = abs(dist6(rng)) % 26 + 1;
		id = abs(dist6(rng)) % 26 + 1;
		ie = abs(dist6(rng)) % 140 + 1902;
		ig = abs(dist6(rng)) % 140 + 1902;
		ias = " " + std::to_string(ia)+ "/" + std::to_string(ic) + "/" + std::to_string(ie) + " ";
		ibs = " \"" + std::to_string(ib)+ "/" + std::to_string(id) + "/" + std::to_string(ig) + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
		e.push_back(ic);
		f.push_back(id);
		g.push_back(ie);
		h.push_back(ig);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	int ii;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		//std::cout << outputDate(cppa) << "," << c[i] << "/" << e[i] << "/" << g[i] << std::endl;
		assert(cppa.t == 'D');
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 dates: "<< now - start << ", ";
    
    start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<10000000;i++) {
		cppb = cppconstructor(b[i].c_str());
		//std::cout << outputDate(cppb) << "," << d[i] << "/" << f[i] << "/" << h[i] << std::endl;
		assert(cppb.t == 'D');
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 dates (w/ q): "<< now - start << std::endl;
        
	return 0;
}

int loaddates2() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e, f, g, h;
	int i;
	long ia, ib, ic, id, ie, ig;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = abs(dist6(rng)) % 12 + 1;
		ib = abs(dist6(rng)) % 12 + 1;
		ic = abs(dist6(rng)) % 26 + 1;
		id = abs(dist6(rng)) % 26 + 1;
		ie = abs(dist6(rng)) % 140 + 1902;
		ig = abs(dist6(rng)) % 140 + 1902;
		ias = " /" + std::to_string(ia*ib - 6) + " ";
		ibs = " \"/" + std::to_string(ia*ib - 6) + "\" ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ib);
		e.push_back(ic);
		f.push_back(id);
		g.push_back(ie);
		h.push_back(ig);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	int ii;

    
    start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	for (i=0;i<100;i++) {
		cppb = cppconstructor(a[i].c_str());
		std::cout << outputDate(cppb) << "," << c[i]*d[i] - 6 << std::endl;
		assert(cppb.t == 'D');
	}
	
	for (i=0;i<100;i++) {
		cppb = cppconstructor(b[i].c_str());
		std::cout << outputDate(cppb) << "," << c[i]*d[i] - 6 << std::endl;
		assert(cppb.t == 'D');
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "load 10,000,000 dates (w/ q): "<< now - start << std::endl;
    
	return 0;
}
int testaddition() {
	if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng);
			ib = dist6(rng);
			ias = " " + std::to_string(ia) + " ";
			ibs = " " + std::to_string(ib) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ib);
		}
		
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << " , " << cppc.t << "," << c[i] << "," << d[i] << " , " << a[i].t << "," << b[i].t << std::endl;

			if (cppc.t == 'I'){assert(cppc.v  == c[i]+d[i]);} 
			else {assert(cppc.t == 'F' && cppc.v  < (d[i] + c[i])/pow(10,cppc.w) +10 && cppc.v  > (d[i] + c[i])/pow(10,cppc.w) - 10);}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Ints + Ints
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib, ic;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			ias = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			ibs = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ic);
			d.push_back(ia);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			
			if (cppc.w > 0) {
				assert(cppc.t == 'F' && cppc.v  < (d[i] + c[i])/pow(10,cppc.w) +100 && cppc.v  > (d[i] + c[i])/pow(10,cppc.w) - 100);
			}
			else if (cppc.w < 0) {
				assert(cppc.t == 'F' && cppc.v/pow(10,-1*cppc.w)  < (d[i] + c[i]) +100 && cppc.v/pow(10,-1*cppc.w)  > (d[i] + c[i]) - 100);
			}
			else {
				assert(cppc.t == 'F' && cppc.v  < (d[i] + c[i]) +100 && cppc.v  > (d[i] + c[i]) - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Floats + Ints
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e;
		int i;
		long ia, ib, ic;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			ibs = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.t == 'I') {assert(cppc.v == c[i]+d[i]);}
			else if (cppc.t == 'R') {
				if (cppc.v*e[i] == (c[i]+d[i]*e[i])*cppc.w){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << b[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v*e[i] == (c[i]+d[i]*e[i])*cppc.w);
			}
			else if (cppc.t == 'F') {
				if (cppc.w > 0) {
					if (cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100);
				}
				else if (cppc.w < 0) {
					if (cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100);
				}
				else {
					if (cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100);
				}
			}
			
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Ints
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			id = abs(dist6(rng)) % 100000 + 1;
			ias = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			
			if (cppc.w > 0) {
				assert(cppc.t == 'F' && cppc.v  < (d[i] + c[i])/pow(10,cppc.w) +100 && cppc.v  > (d[i] + c[i])/pow(10,cppc.w) - 100);
			}
			else if (cppc.w < 0) {
				assert(cppc.t == 'F' && cppc.v/pow(10,-1*cppc.w)  < (d[i] + c[i]) +100 && cppc.v/pow(10,-1*cppc.w)  > (d[i] + c[i]) - 100);
			}
			else {
				assert(cppc.t == 'F' && cppc.v  < (d[i] + c[i]) +100 && cppc.v  > (d[i] + c[i]) - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Floats + Floats
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 100000 + 1;
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 100000 + 1;
			ibs = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";\
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.w > 0) {
				if (cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100);
			}
			else if (cppc.w < 0) {
				if (cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100);
			}
			else {
				if (cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Floats
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e, f;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 10000 + 1;
			if (id < 5000){
				id = abs(dist6(rng)) % 10 + 1;
			}
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "/" + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
			f.push_back(id);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] + b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.t == 'R') {
				if (cppc.v/cppc.w == (c[i]*f[i]+d[i]*e[i])/(e[i]*f[i])){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << b[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v/cppc.w == (c[i]*f[i]+d[i]*e[i])/(e[i]*f[i]));
			}
			else if (cppc.t == 'F') {
				if (cppc.w > 0) {
					if (cppc.v <(c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v <(c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] - 100);
				}
				else if (cppc.w < 0) {
					if (cppc.v/pow(10,-1*cppc.w) < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v/pow(10,-1*cppc.w) < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100);
				}
				else {
					if (cppc.v < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100);
				}
			}
			
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Rationals
	
	return 0;
}
int testsubtraction() {
	if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng);
			ib = dist6(rng);
			ias = " " + std::to_string(ia) + " ";
			ibs = " " + std::to_string(ib) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ib);
		}
		
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << " , " << cppc.t << "," << c[i] << "," << d[i] << " , " << a[i].t << "," << b[i].t << std::endl;

			if (cppc.t == 'I'){assert(cppc.v  == c[i]-d[i]);} 
			else {assert(cppc.t == 'F' && cppc.v  < (c[i] - d[i])/pow(10,cppc.w) +10 && cppc.v  > (c[i] - d[i])/pow(10,cppc.w) - 10);}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Ints + Ints
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib, ic;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			ias = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			ibs = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ic);
			d.push_back(ia);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			
			if (cppc.w > 0) {
				assert(cppc.t == 'F' && cppc.v  < (c[i] - d[i])/pow(10,cppc.w) +100 && cppc.v  > (c[i] - d[i])/pow(10,cppc.w) - 100);
			}
			else if (cppc.w < 0) {
				assert(cppc.t == 'F' && cppc.v/pow(10,-1*cppc.w)  < (c[i] - d[i]) +100 && cppc.v/pow(10,-1*cppc.w)  > (c[i] - d[i]) - 100);
			}
			else {
				assert(cppc.t == 'F' && cppc.v  < (c[i] - d[i]) +100 && cppc.v  > (c[i] - d[i]) - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Floats + Ints
    /*
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e;
		int i;
		long ia, ib, ic;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			ibs = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.t == 'I') {assert(cppc.v == c[i]-d[i]);}
			else if (cppc.t == 'R') {
				if (cppc.v*e[i] == (c[i]-d[i]*e[i])*cppc.w){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << b[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v*e[i] == (c[i]-d[i]*e[i])*cppc.w);
			}
			else if (cppc.t == 'F') {
				if (cppc.w > 0) {
					if (cppc.v <(c[i]-d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]-d[i]*e[i])/pow(10,cppc.w)/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v <(c[i]-d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]-d[i]*e[i])/pow(10,cppc.w)/e[i] - 100);
				}
				else if (cppc.w < 0) {
					if (cppc.v/pow(10,-1*cppc.w) < (c[i]-d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]-d[i]*e[i])/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v/pow(10,-1*cppc.w) < (c[i]-d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]-d[i]*e[i])/e[i] - 100);
				}
				else {
					if (cppc.v < (c[i]-d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]-d[i]*e[i])/e[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v < (c[i]-d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]-d[i]*e[i])/e[i] - 100);
				}
			}
			
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Ints
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng);
			ib = abs(dist6(rng)) % 100000 + 1;
			ic = dist6(rng);
			id = abs(dist6(rng)) % 100000 + 1;
			ias = " " + std::to_string(ia)+ "." + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			
			if (cppc.w > 0) {
				assert(cppc.t == 'F' && cppc.v  < (c[i] - d[i])/pow(10,cppc.w) +100 && cppc.v  > (c[i] - d[i])/pow(10,cppc.w) - 100);
			}
			else if (cppc.w < 0) {
				assert(cppc.t == 'F' && cppc.v/pow(10,-1*cppc.w)  < (c[i] - d[i]) +100 && cppc.v/pow(10,-1*cppc.w)  > (c[i] - d[i]) - 100);
			}
			else {
				assert(cppc.t == 'F' && cppc.v  < (c[i] - d[i]) +100 && cppc.v  > (c[i] - d[i]) - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Floats + Floats
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 100000 + 1;
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		for (i=0;i<5000000;i++) {
			ia = dist6(rng) % 1000000000;
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 100000 + 1;
			ibs = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ias = " " + std::to_string(ic)+ "." + std::to_string(id) + " ";\
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.w > 0) {
				if (cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v <(c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/pow(10,cppc.w)/e[i] - 100);
			}
			else if (cppc.w < 0) {
				if (cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v/pow(10,-1*cppc.w) < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]+d[i]*e[i])/e[i] - 100);
			}
			else {
				if (cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v < (c[i]+d[i]*e[i])/e[i] + 100 && cppc.v > (c[i]+d[i]*e[i])/e[i] - 100);
			}
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Floats
    if (2 == 2) {
		std::vector<Cppdata> a, b;
		std::vector<long> c, d, e, f;
		int i;
		long ia, ib, ic, id;
		std::string ias, ibs;
		srand (time(NULL));
		for (i=0;i<10000000;i++) {
			ia = dist6(rng) % 1000000000;
			
			ib = abs(dist6(rng)) % 10000 + 1;
			if (ib < 5000){
				ib = abs(dist6(rng)) % 10 + 1;
			}
			ic = dist6(rng) % 1000000000;
			id = abs(dist6(rng)) % 10000 + 1;
			if (id < 5000){
				id = abs(dist6(rng)) % 10 + 1;
			}
			ias = " " + std::to_string(ia)+ "/" + std::to_string(ib) + " ";
			ibs = " " + std::to_string(ic)+ "/" + std::to_string(id) + " ";
			a.push_back(cppconstructor(ias.c_str()));
			b.push_back(cppconstructor(ibs.c_str()));
			c.push_back(ia);
			d.push_back(ic);
			e.push_back(ib);
			f.push_back(id);
		}
		start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
		Cppdata cppc;
		for (i=0;i<10000000;i++) {
			cppc = a[i] - b[i];
			//std::cout << c[i]+d[i] << " , " << cppc.v << " , " << cppc.w << "," << c[i] << "," << d[i] << "," << a[i].t << "," << b[i].t << std::endl;
			if (cppc.t == 'R') {
				if (cppc.v/cppc.w == (c[i]*f[i]+d[i]*e[i])/(e[i]*f[i])){}
				else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << b[i].w << "," << b[i].v << std::endl;}
				assert(cppc.v/cppc.w == (c[i]*f[i]+d[i]*e[i])/(e[i]*f[i]));
			}
			else if (cppc.t == 'F') {
				if (cppc.w > 0) {
					if (cppc.v <(c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v <(c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/pow(10,cppc.w)/e[i]/f[i] - 100);
				}
				else if (cppc.w < 0) {
					if (cppc.v/pow(10,-1*cppc.w) < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v/pow(10,-1*cppc.w) < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v/pow(10,-1*cppc.w) > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100);
				}
				else {
					if (cppc.v < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100){}
					else {std::cout << c[i] << " , " << d[i] << " , " << e[i] << "," << cppc.v << "," << cppc.w << "," << a[i].v << "," << a[i].w << "," << b[i].v << std::endl;}
					assert(cppc.v < (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] + 100 && cppc.v > (c[i]*f[i]+d[i]*e[i])/e[i]/f[i] - 100);
				}
			}
			
		}
		now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
		std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
    } // Rationals + Rationals
	*/
	return 0;
}
/*
int stringcomp() {
	std::vector<std::string> a, b;
	std::vector<double> dd;
	dd.resize(1000000);
	int i;
	long ia, ib, ic, id;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<1000000;i++) {
		ia = dist6(rng);
		ib = dist6(rng);
		ias = std::to_string(ia);
		ibs = std::to_string(1234567);
		a.push_back(ias);
		b.push_back(ibs);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	//std::vector<std::vector<short>> d;
	for (i=0;i<1000000;i++) {
		dd[i] = fast_dl_distance(a[i].c_str(),b[i].c_str());
		//if (d[i] < 200) {std::cout << a[i] << std::endl;}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "string distances: "<< now - start << std::endl;
    
    std::partial_sort(&dd[0],&dd[100],&dd[1000000]);
    now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << dd[0] << " sorted: "<< now - start << std::endl;
}
*/
int testints() {
	std::vector<std::string> a, b;
	std::vector<long> c, d;
	int i;
	long ia, ib;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = rand() % 2000000000 - 1500000000;
		ib = rand() % 2000000000 - 1500000000;
		ias = " " + std::to_string(ia) + " ";
		ibs = " " + std::to_string(ib) + " ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia+ib);
		d.push_back(ia-ib);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	Cppdata cppc;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		cppb = cppa + cppconstructor(b[i].c_str());
		cppc = cppa - cppconstructor(b[i].c_str());
		//std::cout << std::to_string(iSecret).c_str() << " , " << cppd.v << " , " << cppd.t << std::endl;
		if (cppb.t == 'I'){assert(cppb.v  == c[i]);} 
		else {assert(cppb.v  < c[i]/10 +2 && cppb.v  > c[i]/10 - 2);}
		if (cppc.t == 'I'){assert(cppc.v  == d[i]);} 
		else {assert(cppc.v  < d[i]/10 +2 && cppc.v  > d[i]/10 - 2);}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "add and sub 10,000,000 ints: "<< now - start << std::endl;
	return 0;
}

int testrationals() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e;
	int i;
	long ia, ib, ic, id;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = rand() % 2000000 - 1500000;
		ib = rand() % 2000000 - 1500000;
		ic = rand() % 100 + 1;
		id = rand() % 100 + 1;
		ias = " " + std::to_string(ia)+ "/" + std::to_string(ic) + " ";
		ibs = " " + std::to_string(ib)+ "/" + std::to_string(id)  + " ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia*id+ib*ic);
		d.push_back(ia*id-ib*ic);
		e.push_back(ic*id);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	Cppdata cppc;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		cppb = cppa + cppconstructor(b[i].c_str());
		//cppc = cppa - cppconstructor(b[i].c_str());
		//std::cout << std::to_string(iSecret).c_str() << " , " << cppd.v << " , " << cppd.t << std::endl;
		//if (cppb.t == 'R'){assert(cppb.v*e[i]  == c[i]*cppb.w);}
		if (cppb.t == 'R'){assert(cppb.w > 0);}  
		//else {assert(cppb.v  < c[i]/10 +2 && cppb.v  > c[i]/10 - 2);}
		//if (cppc.t == 'R'){assert(cppc.v*e[i]  == d[i]*cppc.w);} 
		//else {assert(cppc.v  < d[i]/10 +2 && cppc.v  > d[i]/10 - 2);}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "add 10,000,000 rationals: "<< now - start << std::endl;
	return 0;
}

int testfloats() {
	std::vector<std::string> a, b;
	std::vector<long> c, d, e, f;
	std::vector<float> g, h;
	int i;
	long ia, ib, ic, id;
	float fa, fb;
	std::string ias, ibs;
	srand (time(NULL));
	for (i=0;i<10000000;i++) {
		ia = rand() % 20000 + 15000;
		ib = rand() % 20000 + 15000;
		ic = rand() % 900 + 100;
		id = rand() % 900 + 100;
		fa = ia + ic*.0001;
		fb = ib + id*.0001;
		ias = " " + std::to_string(ia)+ "." + std::to_string(ic) + " ";
		ibs = " " + std::to_string(ib)+ "." + std::to_string(id)  + " ";
		a.push_back(ias);
		b.push_back(ibs);
		c.push_back(ia);
		d.push_back(ic);
		e.push_back(ib);
		f.push_back(id);
		g.push_back(fa);
		h.push_back(fb);
	}
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	Cppdata cppa;
	Cppdata cppb;
	Cppdata cppc;
	float fc;
	int ii;
	for (i=0;i<10000000;i++) {
		cppa = cppconstructor(a[i].c_str());
		cppb = cppconstructor(b[i].c_str());
		cppc = cppa + cppb;
		//std::cout << std::to_string(iSecret).c_str() << " , " << cppd.v << " , " << cppd.t << std::endl;
		//if (cppb.t == 'R'){assert(cppb.v*e[i]  == c[i]*cppb.w);}
		if (cppa.t == 'F' && cppa.w < 0){
			for (ii=0;ii>cppa.w;ii--){
				c[i] *= 10;
			}
			for (ii=0;ii>cppb.w;ii--){
				e[i] *= 10;
			}
			//std::cout << cppa.w << ","<< cppb.w << ","<< cppc.v << "," << c[i] << "," << d[i] << "," << e[i] << "," << f[i] << "," << c[i] + d[i] + e[i] + f[i] << std::endl;
			//std::cout << cppa.v << ","<< cppa.w << ","<< cppb.v << "," << cppb.w << "," << cppc.v << "," << cppc.w << std::endl;
			assert(cppa.v == c[i] + d[i]);
			assert(cppb.v == e[i] + f[i]);
			
			assert(cppc.v > 0);
		}  
		//assert(fc != 'a');
		//else {assert(cppb.v  < c[i]/10 +2 && cppb.v  > c[i]/10 - 2);}
		//if (cppc.t == 'R'){assert(cppc.v*e[i]  == d[i]*cppc.w);} 
		//else {assert(cppc.v  < d[i]/10 +2 && cppc.v  > d[i]/10 - 2);}
	}
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << "add 10,000,000 floats: "<< now - start << std::endl;
	return 0;
}

int main() {
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
	//stringcomp();
	//loadints();
	//loadrationals();
	//loadfloats();
	//loaddates1();
	//loaddates2();
	//testaddition();
	//testsubtraction();
	//testrationals();
	//testfloats();
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    std::cout << now << " , loaded , "<< now - start << std::endl;
    
    return 0;
}