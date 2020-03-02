#define NAPI_VERSION 3
#include <napi.h>
#include <string>

namespace functionexample {
  std::string getType(std::string);
  Napi::TypedArray TypeWrapped(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}