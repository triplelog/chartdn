#include <nan.h>
#include <string>


void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	std::string x = info[0];
  	info.GetReturnValue().Set(Nan::New(x).ToLocalChecked());
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

