#include <nan.h>
#include <string>
#include "isNumber.cpp"

bool grabNumber(char* input_str) {
	/*int sz = input_str.size();
	int i=0;
	for (i=0;i<sz;i++){
		if (input_str[i] == '9'){
			return true;
		}
	}*/
	return false;
}

void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::String::Utf8Value s(isolate, info[0]);
	//grabNumber(*s);
    v8::Local<v8::String> retval = v8::String::NewFromUtf8(isolate, *s).ToLocalChecked();
    //args.GetReturnValue().Set(retval);
	//v8::Local<v8::String> xxx = xx + xx;
  	//info.GetReturnValue().Set(xxx);
  	//Nan::Utf8String utf8_value(info[0]->ToString(context));
	//v8::Local<v8::String> xxx = xx + xx;
  	info.GetReturnValue().Set(retval);
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

