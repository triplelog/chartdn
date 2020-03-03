#include <nan.h>
#include <string>
#include "cppdatatemp.hpp"

bool grabNumber(char* input_str) {
	int sz = sizeof(input_str)/sizeof(char*);
	int i=0;
	for (i=0;i<sz;i++){
		if (input_str[i] == '9'){
			return true;
		}
	}
	return false;
}
/*
struct Cppdata {
	int v = 1;
	short w = 1;
	char t = 'I';
}*/
void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::String::Utf8Value s(isolate, info[0]);
	Cppdata x = cppconstructor(*s);
	v8::Local<v8::Object> retobj = v8::Object::New();
	if (x.t == 'I'){
		//v8::Local<v8::Integer> retval = v8::Integer::New(isolate, x.v);
		v8::Local<v8::String> retval = v8::String::NewFromUtf8(isolate, &x.t).ToLocalChecked();
  		info.GetReturnValue().Set(retval);
	}
	else {
		v8::Local<v8::String> retval = v8::String::NewFromUtf8(isolate, &x.t).ToLocalChecked();
  		info.GetReturnValue().Set(retval);
	}
	
    
}

void Init(v8::Local<v8::Object> exports) {
  v8::Local<v8::Context> context = exports->CreationContext();
  exports->Set(context,
               Nan::New("hello").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(Method)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

NODE_MODULE(hello, Init)

