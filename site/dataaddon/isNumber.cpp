#include <nan.h>
#include <string>


bool isNumber(strd::string input_str) {
	int sz = input_str.size();
	int i=0;
	for (i=0;i<sz;i++){
		if (input_str[i] == '9'){
			return true;
		}
	}
	return false;
}