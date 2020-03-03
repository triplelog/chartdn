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

void MethodClear(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	statarray.clear();
}

void MethodRead(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	int row = info[0]->Int32Value(context).FromJust();
	//int row = (int)(info[0]->Int32Value(context));
	
	std::vector<Cppdata> statrow = statarray[row];
	int sz = statrow.size();
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(sz*3);
	
	int ii=0;
	for (ii=0;ii<sz;ii++){
		
		const char* t = &statrow[ii].t;
		Nan::MaybeLocal<v8::String> tt = Nan::New<v8::String>(t, 1);
		Nan::Set(outArray,ii*3+0,tt.ToLocalChecked());
		Nan::Set(outArray,ii*3+1,v8::Number::New(isolate,statrow[ii].v));
		Nan::Set(outArray,ii*3+2,v8::Number::New(isolate,statrow[ii].w));
		//Nan::Set(outArray,ii,v8::String::NewFromUtf8(isolate,&statrow[ii].t).ToLocalChecked());
	}
	info.GetReturnValue().Set(outArray);
}

void MethodLoad(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Array> inArray = v8::Local<v8::Array>::Cast(info[0]);
	int sz = inArray->Length();
	int ii=0;
	std::vector<Cppdata> statrow;
	for (ii=0;ii<sz;ii++){
		v8::String::Utf8Value s(isolate, Nan::Get(inArray,ii).ToLocalChecked());
		x = cppconstructor(*s);
		statrow.push_back(x);
	}
	statarray.push_back(statrow);

}

void Init(v8::Local<v8::Object> exports) {
  //std::vector<Cppdata>* statarray = new std::vector<Cppdata>[plen];
  v8::Local<v8::Context> context = exports->CreationContext();
  exports->Set(context,
               Nan::New("loadarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodLoad)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("readarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodRead)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("cleararray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodClear)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

NODE_MODULE(helloarray, Init)

