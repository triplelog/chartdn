#include "datatypes.h"
#include <napi.h>
#include <string>
/*
static void Method(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(v8::String::NewFromUtf8(
        isolate, "world", v8::NewStringType::kNormal).ToLocalChecked());
}

static void DataType(const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(v8::String::NewFromUtf8(
        isolate, "world", v8::NewStringType::kNormal).ToLocalChecked());
}

// Not using the full NODE_MODULE_INIT() macro here because we want to test the
// addon loader's reaction to the FakeInit() entry point below.
extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports,
                        v8::Local<v8::Value> module,
                        v8::Local<v8::Context> context) {
  NODE_SET_METHOD(exports, "hello", Method);
  NODE_SET_METHOD(exports, "dataType", DataType);
}
*/

std::string functionexample::hello(){
  return "Hello World";
}
Napi::String functionexample::HelloWrapped(const Napi::CallbackInfo& info) 
{
  Napi::Env env = info.Env();
  Napi::String returnValue = Napi::String::New(env, functionexample::hello());
  
  return returnValue;
}
Napi::Object functionexample::Init(Napi::Env env, Napi::Object exports) 
{
  exports.Set(
"hello", Napi::Function::New(env, functionexample::HelloWrapped)
  );
 
  return exports;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
	return exports;
	return functionexample::Init(env, exports);
 }
 
NODE_API_MODULE(testaddon, InitAll)


