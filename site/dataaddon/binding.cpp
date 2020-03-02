#include "datatypes.h"
#include <napi.h>
#include <string>


std::string functionexample::getType(std::string a){
  return a;
}
std::string functionexample::TypeWrapped(const Napi::CallbackInfo& info) 
{
  Napi::Env env = info.Env();
  Napi::Array napiArray = info[0].As<Napi::Array>();
  Napi::Array outputArray = Napi::Array::New(env, napiArray.Length());
  int i;
  int maxi = 1000000;
  for (i=0;i<maxi;i++){
  	std::string a = "aa";
  	//outputArray[i] = Napi::String::New(env, a);
  }
  std::string out = "aa";
  //Napi::String input = info[0].As<Napi::String>();
  //std::string x = info[0].As<Napi::String>();
  //std::string y = std::string(info[0].As<Napi::String>());
  //Napi::String returnValue = napiArray.Get(534).As<Napi::String>();
 // Napi::String returnValue = Napi::String::New(env, functionexample::getType(input));
  
  return out;
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


