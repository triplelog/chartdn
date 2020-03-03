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
#include <stdio.h>      /* printf, scanf, puts, NULL */
#include <stdlib.h>     /* srand, rand */
#include <time.h>       /* time */
#include <vector>
using namespace std::chrono;
unsigned int now; unsigned int start;

inline int continued_fraction(int a, int b) {
	
	int q = a/b;
	int r = a%b;
	int i = 1;
	int appd = 1;
	//int d[10];
	//d[0] = q;
	int denom;
	
	while (i<10) {
		a = b*i;
		b = r;
		
		q = a/b;
		
		//d[i] = q;
		appd *= q;
		if (appd > 32000){break;}
		r = a - q*b;
		if (r == 0) {break;}
		i++;
	}
	
	return q;
}

int main() {
	
	start = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	
	std::vector<int> numer;
	int i;
	for (i=0;i<10000000;i++){
		srand (time(NULL));
		numer.push_back(rand() % 100000000 + 1);
	}
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
	printf("\n%d,%d\n", now ,now - start);
	
	int qq;
	for (i=0;i<10000000;i++){
		qq = continued_fraction(numer[i],10000000);
		//qq = numer[i];
		if (i % 1000000 < 1) {printf("%d\n",qq);}
		//printf("\n");
	}
	//continued_fraction(314165,100000);
	
	now = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
    printf("\n%d,%d\n", now,now - start);
	return 0;
}