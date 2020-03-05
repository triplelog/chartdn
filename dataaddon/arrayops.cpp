#include <nan.h>
#include <string>
#include "cppdatatemp.hpp"


Cppdata x;
std::vector<std::vector<Cppdata>> statarray;
std::vector<std::vector<std::string>> strarray;
std::vector<std::vector<Cppdata>> temparray;

#include "newcolumn.hpp"

void MethodCopy(const Nan::FunctionCallbackInfo<v8::Value>& info);

void MethodClear(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	statarray.clear();
	strarray.clear();
}

void MethodRead(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	int row = info[0]->Int32Value(context).FromJust();
	int type = 0;
	if (info.Length() > 1){
		type = info[1]->Int32Value(context).FromJust();
	}
	//int row = (int)(info[0]->Int32Value(context));
	std::vector<Cppdata> statrow;
	if (row < temparray.size() && row >= 0){
		statrow = temparray[row];
	}
	/*if (type == 1) {
		statrow = temparray[row];
	} 
	else {
		statrow = statarray[row];
	}*/
	int sz = statrow.size();
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(sz*3);
	
	int ii=0;
	for (ii=0;ii<sz;ii++){
		if (statrow[ii].t == 'S'){
			const char* t = &statrow[ii].t;
			Nan::MaybeLocal<v8::String> tt = Nan::New<v8::String>(t, 1);
			Nan::MaybeLocal<v8::String> ttt = Nan::New<v8::String>(strarray[statrow[ii].v][statrow[ii].w]);
			Nan::Set(outArray,ii*3+0,tt.ToLocalChecked());
			Nan::Set(outArray,ii*3+1,ttt.ToLocalChecked());
			Nan::Set(outArray,ii*3+2,v8::Number::New(isolate,statrow[ii].w));
		}
		else {
			const char* t = &statrow[ii].t;
			Nan::MaybeLocal<v8::String> tt = Nan::New<v8::String>(t, 1);
			Nan::Set(outArray,ii*3+0,tt.ToLocalChecked());
			Nan::Set(outArray,ii*3+1,v8::Number::New(isolate,statrow[ii].v));
			Nan::Set(outArray,ii*3+2,v8::Number::New(isolate,statrow[ii].w));
		}
		//Nan::Set(outArray,ii,v8::String::NewFromUtf8(isolate,&statrow[ii].t).ToLocalChecked());
	}
	info.GetReturnValue().Set(outArray);
}

void MethodCol(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	int col = info[0]->Int32Value(context).FromJust();
	int type = 0;
	if (info.Length() > 1){
		type = info[1]->Int32Value(context).FromJust();
	}
	//int row = (int)(info[0]->Int32Value(context));
	int sz = temparray.size();
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(sz*3);
	
	
	Cppdata oneData;
	std::vector<Cppdata> oneRow;
	std::vector<std::vector<Cppdata>>::iterator it;
	int ii=0;
	for (it = temparray.begin() ; it != temparray.end(); ++it){
		oneRow = *it;
		if (col < oneRow.size()){
			oneData = oneRow[col];
			const char* t = &oneData.t;
			Nan::MaybeLocal<v8::String> tt = Nan::New<v8::String>(t, 1);
			Nan::Set(outArray,ii*3+0,tt.ToLocalChecked());
			Nan::Set(outArray,ii*3+1,v8::Number::New(isolate,oneData.v));
			Nan::Set(outArray,ii*3+2,v8::Number::New(isolate,oneData.w));
			//Nan::Set(outArray,ii,v8::String::NewFromUtf8(isolate,&statrow[ii].t).ToLocalChecked());
		}
		ii++;
	}
	info.GetReturnValue().Set(outArray);
}

void MethodLoad(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Array> inArray = v8::Local<v8::Array>::Cast(info[0]);
	int sz = inArray->Length();
	int ii=0;
	std::vector<Cppdata> statrow;
	std::vector<std::string> strrow;
	int idx = 0;
	for (ii=0;ii<sz;ii++){
		v8::String::Utf8Value s(isolate, Nan::Get(inArray,ii).ToLocalChecked());
		x = cppconstructor(*s);
		if (x.t == 'S'){
			std::string str(*s);
			strrow.push_back(str);
			x.v = statarray.size();
			x.w = idx;
			idx++;
			
		}
		statrow.push_back(x);
		
	}
	statarray.push_back(statrow);
	strarray.push_back(strrow);

}

void MethodCopy(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	temparray.clear();
	std::vector<Cppdata> onearray;
	int sz = statarray.size();
	int szz = statarray[0].size();
	onearray.resize(szz);
	temparray.resize(sz,onearray);
	int i=0; int ii = 0;
	for (i=0; i<sz; i++) {
		std::vector<Cppdata> onerow(szz);
		for (ii=0; ii<szz; ii++) {
			onerow[ii].t=statarray[i][ii].t;
			onerow[ii].v=statarray[i][ii].v;
			onerow[ii].w=statarray[i][ii].w;
		}
		temparray[i] =onerow;
	}

}

void MethodSort(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	bool ascending = info[1]->BooleanValue(isolate);
	int col = info[0]->Int32Value(context).FromJust();
	
	sortCol.clear();
	vsize = 0;
	std::vector<int> oneSort;
	if (ascending){oneSort.push_back(1);}
	else {oneSort.push_back(0);}
	
	oneSort.push_back(col);
	sortCol.push_back(oneSort);
	vsize++;
	//std::sort(temparray.begin(),temparray.end());
	if (1000<temparray.size()){
		std::partial_sort(temparray.begin(),temparray.begin()+1000,temparray.end());
	}
	else {
		std::sort(temparray.begin(),temparray.end());
	}

}

void MethodNewCol(const Nan::FunctionCallbackInfo<v8::Value>& info) {
	v8::Isolate* isolate = info.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	
	NewColumn newcol;
	v8::Local<v8::Array> intstrArray = v8::Local<v8::Array>::Cast(info[0]);
	int ii;
	for (ii=0;ii<intstrArray->Length();ii++){
		v8::String::Utf8Value s(isolate, Nan::Get(intstrArray,ii).ToLocalChecked());
		std::string str(*s);
		newcol.intstr.push_back(str);
	}
	
	
	v8::String::Utf8Value expin(isolate, info[1]);
	std::string estr(*expin);
	newcol.expstr = estr;
	
	v8::Local<v8::Array> newvarArray = v8::Local<v8::Array>::Cast(info[2]);
	for (ii=0;ii<newvarArray->Length()/7;ii++){
		NewColumnVar newvar;
		
		v8::String::Utf8Value s(isolate, Nan::Get(newvarArray,ii*7).ToLocalChecked());
		std::string str(*s);
		newvar.type = str;
		
		v8::String::Utf8Value s2(isolate, Nan::Get(newvarArray,ii*7+1).ToLocalChecked());
		std::string str2(*s2);
		newvar.name = str2;
		
		newvar.column = Nan::Get(newvarArray,ii*7+2).ToLocalChecked()->Int32Value(context).FromJust();
		newvar.row[0] = Nan::Get(newvarArray,ii*7+3).ToLocalChecked()->Int32Value(context).FromJust();
		newvar.row[1] = Nan::Get(newvarArray,ii*7+4).ToLocalChecked()->Int32Value(context).FromJust();
		newvar.row[2] = Nan::Get(newvarArray,ii*7+5).ToLocalChecked()->Int32Value(context).FromJust();
		newvar.row[3] = Nan::Get(newvarArray,ii*7+6).ToLocalChecked()->Int32Value(context).FromJust();
		
		newcol.vars.push_back(newvar);
	}
	
	/*
	NewColumnVar newvar2;
	newvar2.column = 2;
	newvar2.type = "value";
	newvar2.row[0] = -2;
	newvar2.row[1] = -2;
	newvar2.row[2] = 0;
	newvar2.row[3] = -2;
	newvar2.name = "b";
	newcol.vars.push_back(newvar2);*/
	
	
	newcol = makeFullMap(newcol);
	int sz = temparray.size();
	int i;
	int len = newcol.expstr.length();
	char exp[len+1];
	strcpy(exp, newcol.expstr.c_str());
		
	std::vector<Cppdata> stack;
	stack.resize(len);
	
	v8::Local<v8::Array> outArray = Nan::New<v8::Array>(sz);
	
	
	for (i=0;i<sz;i++){
		flat_hash_map<std::string,Cppdata> rowmap = makeRowMap(newcol,i);
		//if (rowmap === 'skip'){array[i].push(''); continue;}
		int szintstr = newcol.intstr.size();
		std::vector<Cppdata> intArray;
		flat_hash_map<std::string,Cppdata>::iterator f;
		for (ii=0;ii<szintstr;ii++){
			f = newcol.fullmap.find(newcol.intstr[ii]);
			if (f != newcol.fullmap.end()){
				intArray.push_back(f->second);
			}
			else {
				f = rowmap.find(newcol.intstr[ii]);
				if (f != rowmap.end()){
					intArray.push_back(f->second);
				}
				else {
					intArray.push_back(cppconstructor(newcol.intstr[ii].c_str()));
				}
			}
		}
		
		//Nan::Set(outArray,i,v8::Number::New(isolate,newcol.fullmap["a"].v));
		
		Cppdata answer = solvePostfixVV(exp, intArray, stack);
		temparray[i].push_back(answer);

	}
	//info.GetReturnValue().Set(outArray);
	//types.push('Float');*/

}

void Init(v8::Local<v8::Object> exports) {
  //std::vector<Cppdata>* statarray = new std::vector<Cppdata>[plen];
  v8::Local<v8::Context> context = exports->CreationContext();
  exports->Set(context,
               Nan::New("loadarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodLoad)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("readarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodRead)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("cleararray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodClear)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("copyarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodCopy)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("sortarray").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodSort)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("readarraycol").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodCol)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context,
               Nan::New("newcolumn").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(MethodNewCol)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

NODE_MODULE(helloarray, Init)

