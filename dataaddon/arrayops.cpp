#include <nan.h>
#include <string>
#include "cppdatatemp.hpp"

Cppdata x;
std::vector<std::vector<Cppdata>> statarray;
std::vector<std::vector<Cppdata>> temparray;


void MethodClear(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	statarray.clear();
}

void MethodRead(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	int row = info[0]->Int32Value(context).FromJust();
	int type = 0;
	if (info.Length() > 1){
		type = info[1]->Int32Value(context).FromJust();
	}
	//int row = (int)(info[0]->Int32Value(context));
	
	std::vector<Cppdata> statrow = temparray[row];
	/*if (type == 1) {
		statrow = temparray[row];
	} 
	else {
		statrow = statarray[row];
	}*/
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

void MethodCol(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	int col = info[0]->Int32Value(context).FromJust();
	int type = 0;
	if (info.Length() > 1){
		type = info[1]->Int32Value(context).FromJust();
	}
	//int row = (int)(info[0]->Int32Value(context));
	int sz = temparray.size();
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(sz*3);
	
	int ii=0;
	for (ii=0;ii<sz;ii++){
		const char* t = &temparray[ii][col].t;
		Nan::MaybeLocal<v8::String> tt = Nan::New<v8::String>(t, 1);
		Nan::Set(outArray,ii*3+0,tt.ToLocalChecked());
		Nan::Set(outArray,ii*3+1,v8::Number::New(isolate,temparray[ii][col].v));
		Nan::Set(outArray,ii*3+2,v8::Number::New(isolate,temparray[ii][col].w));
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

void MethodCopy(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	temparray.clear();
	std::vector<Cppdata> onearray;
	int sz = statarray.size();
	int szz = statarray[0].size();
	onearray.resize(szz);
	temparray.resize(sz,onearray);
	int i=0; int ii = 0;
	for (i=0; i<sz; i++) {
		std::vector<Cppdata> onerow(szz);
		for (ii=0; ii<szz; ii++) {
			onerow[ii].t=statarray[i][ii].t;
			onerow[ii].v=statarray[i][ii].v;
			onerow[ii].w=statarray[i][ii].w;
		}
		temparray[i] =onerow;
	}

}

void MethodSort(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	std::vector<int> oneSort;
	oneSort.push_back(1);
	oneSort.push_back(1);
	sortCol.push_back(oneSort);
	vsize++;
	//std::sort(temparray.begin(),temparray.end());
	std::partial_sort(temparray.begin(),temparray.begin()+1000,temparray.end());

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
  exports->Set(context,
               Nan::New("copyarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodCopy)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("sortarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodSort)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("readarraycol").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodCol)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

NODE_MODULE(helloarray, Init)

