#include <nan.h>

// Simple synchronous access to the `Estimate()` function
NAN_METHOD(CalculateSync) {
  // expect a number as the first argument
  int points = info[0]->Uint32Value();

  info.GetReturnValue().Set(points);
}