#define NAPI_VERSION 3
#include <napi.h>
#include <string>

namespace functionexample {
  std::string getType(std::string);
  std::string TypeWrapped(const Napi::CallbackInfo& info);
  Napi::Object Init(Napi::Env env, Napi::Object exports);
}