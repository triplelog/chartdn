#include <nan.h>
#include <string>


void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Local<v8::Context> context = info.GetIsolate()->GetCurrentContext();
	std::string xx = info[0]->ToString(context);
  	info.GetReturnValue().Set(Nan::New("hello").ToLocalChecked());
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

