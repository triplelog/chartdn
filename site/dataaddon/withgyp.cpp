#include <nan.h>

using v8::FunctionTemplate;
using v8::Object;
using v8::String;
using Nan::GetFunction;
using Nan::New;
using Nan::Set;

NAN_METHOD(CalculateSync) {
  // expect a number as the first argument
  int points = info[0]->Uint32Value();

  info.GetReturnValue().Set(points);
}

// Estimate() function
NAN_MODULE_INIT(InitAll) {
  Set(target, New<String>("calculateSync").ToLocalChecked(),
    GetFunction(New<FunctionTemplate>(CalculateSync)).ToLocalChecked());
}

NODE_MODULE(addon, InitAll)

