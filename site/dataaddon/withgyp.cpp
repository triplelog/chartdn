#include <nan.h>
#include <string>


void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::String> xx = info[0]->ToString(context).ToLocalChecked();
	char* charFileName = new char[8192];
	(*xx)->WriteUtf8(isolate, charFileName);
	static std::string stringFileName;
	stringFileName.assign(charFileName);
	//v8::Local<v8::String> xxx = xx + xx;
  	//info.GetReturnValue().Set(xxx);
  	//Nan::Utf8String utf8_value(info[0]->ToString(context));
	//v8::Local<v8::String> xxx = xx + xx;
  	info.GetReturnValue().Set(Nan::New("test").ToLocalChecked());
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

