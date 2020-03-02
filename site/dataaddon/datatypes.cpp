#include <nan.h>
#include <string>
#include "isNumber.cpp"

bool grabNumber(char* input_str) {
	int sz = sizeof(input_str)/sizeof(char*);
	int i=0;
	for (i=0;i<sz;i++){
		if (input_str[i] == '9'){
			return true;
		}
	}
	return false;
}

void Method(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	/*v8::String::Utf8Value s(isolate, info[0]);
	grabNumber(*s);
    v8::Local<v8::String> retval = v8::String::NewFromUtf8(isolate, *s).ToLocalChecked();
  	info.GetReturnValue().Set(retval);*/
  	
  	v8::Local<v8::Array> array = v8::Local<v8::Array>::Cast(info[0]);
  	unsigned int i =0;
    for (i=0;i<1000000;i++){
    	v8::Array::CloneElementAt s(i);
    	//v8::String::Utf8Value s(isolate, array::CloneElementAt(i));
    	grabNumber(*s);
    	v8::Local<v8::String> retval = v8::String::NewFromUtf8(isolate, *s).ToLocalChecked();
    }
    /*for (unsigned int i = 0; i < array->Length(); i++ ) {
      if (array->Has(i)) {
        double value = array->Get(i)->NumberValue();
        array->Set(i, Number::New(isolate, value + 1));
      }
    }

    Local<String> prop = String::NewFromUtf8(isolate, "not_index");
    Local<Array> a = Array::New(isolate);
    a->Set(0, array->Get(0));
    a->Set(1, array->Get(prop));
    a->Set(2, array->Get(2));*/

    info.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, "hello").ToLocalChecked());
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

