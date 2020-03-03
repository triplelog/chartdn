#include <nan.h>
#include <string>
#include "cppdatatemp.hpp"

Cppdata x;
std::vector<std::vector<Cppdata>> statarray;
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

void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Array> inArray = v8::Local<v8::Array>::Cast(info[0]);
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(10);
	int i=0; int ii=0;
	
	
	std::vector<Cppdata> statrow;
	for (ii=0;ii<10;ii++){
		v8::String::Utf8Value s(isolate, Nan::Get(inArray,ii).ToLocalChecked());
		x = cppconstructor(*s);
		Nan::Set(outArray,ii,v8::String::NewFromUtf8(isolate,&x.t).ToLocalChecked());
		statrow.push_back(x);
	}
	statarray.push_back(statrow);
	Nan::Set(outArray,i,v8::Number::New(isolate,int(statarray.size())));
	
	
	/*
	v8::String::Utf8Value s(isolate, info[0]);
	Cppdata x = cppconstructor(*s);
	v8::Local<v8::Object> retobj = v8::Object::New(isolate);
	v8::Local<v8::String> v = v8::String::NewFromUtf8(isolate, "v").ToLocalChecked();
    v8::Local<v8::String> w = v8::String::NewFromUtf8(isolate, "w").ToLocalChecked();
    v8::Local<v8::String> t = v8::String::NewFromUtf8(isolate, "t").ToLocalChecked();
	retobj->Set(context,v,v8::Number::New(isolate,x.v));
	retobj->Set(context,w,v8::Number::New(isolate,x.w));
	retobj->Set(context,t,v8::String::NewFromUtf8(isolate,&x.t).ToLocalChecked());
	info.GetReturnValue().Set(retobj);
	v8::Local<v8::Array> array = Nan::New<v8::Array>(3);
	Nan::Set(array,0,v8::String::NewFromUtf8(isolate,&x.t).ToLocalChecked());
	Nan::Set(array,1,v8::Number::New(isolate,x.v));
	Nan::Set(array,2,v8::Number::New(isolate,x.w));
	*/
	info.GetReturnValue().Set(outArray);
	
    
}

void Init(v8::Local<v8::Object> exports) {
  //std::vector<Cppdata>* statarray = new std::vector<Cppdata>[plen];
  v8::Local<v8::Context> context = exports->CreationContext();
  exports->Set(context,
               Nan::New("helloarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(Method)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

NODE_MODULE(helloarray, Init)

