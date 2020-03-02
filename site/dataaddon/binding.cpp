#include "datatypes.h"
#include <napi.h>
#include <string>


std::string functionexample::getType(std::string a){
  return a;
}
Napi::String functionexample::TypeWrapped(const Napi::CallbackInfo& info) 
{
  Napi::Env env = info.Env();
  //Napi::String input = info[0].As<Napi::String>();
  std::string x = info[0];
  //std::string y = std::string(info[0].As<Napi::String>());
  Napi::String returnValue = Napi::String::New(env, x+x);
 // Napi::String returnValue = Napi::String::New(env, functionexample::getType(input));
  
  return returnValue;
}
Napi::Object functionexample::Init(Napi::Env env, Napi::Object exports) 
{
  exports.Set(
"getType", Napi::Function::New(env, functionexample::TypeWrapped)
  );
 
  return exports;
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
	return functionexample::Init(env, exports);
 }
 
NODE_API_MODULE(testaddon, InitAll)


