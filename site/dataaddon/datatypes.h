#define NAPI_VERSION 3
#include <node_api.h>
#include <string>

namespace functionexample {
  std::string hello();
  Napi::String HelloWrapped(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}