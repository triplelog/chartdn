
function getAllTypes(input_str){
	
	var data = Papa.parse(input_str);
	makeTypes(data.data);

}


function isMonth(input_str){
	input_str = input_str.replace('.','');
	if (input_str == 'january') {return true;}
	if (input_str == 'jan') {return true;}
	if (input_str == 'february') {return true;}
	if (input_str == 'feb') {return true;}
	if (input_str == 'march') {return true;}
	if (input_str == 'mar') {return true;}
	if (input_str == 'april') {return true;}
	if (input_str == 'apr') {return true;}
	if (input_str == 'may') {return true;}
	if (input_str == 'june') {return true;}
	if (input_str == 'jun') {return true;}
	if (input_str == 'july') {return true;}
	if (input_str == 'jul') {return true;}
	if (input_str == 'august') {return true;}
	if (input_str == 'aug') {return true;}
	if (input_str == 'september') {return true;}
	if (input_str == 'sep') {return true;}
	if (input_str == 'october') {return true;}
	if (input_str == 'oct') {return true;}
	if (input_str == 'november') {return true;}
	if (input_str == 'nov') {return true;}
	if (input_str == 'december') {return true;}
	if (input_str == 'dec') {return true;}
	return false;
}
function isDate(input_str){
	var threeparts = input_str.split('/');
	if (threeparts.length == 3) {
		if (parseInt(threeparts[0]) > 0 && parseInt(threeparts[0]) < 13 && threeparts[0].length < 3 && threeparts[0].length > 0){
			if (parseInt(threeparts[1]) > 0 && parseInt(threeparts[1]) < 32 && threeparts[1].length < 3 && threeparts[1].length > 0){
				if (parseInt(threeparts[2]).toString() == threeparts[2] && threeparts[2].length == 4){
					return 'DD/MM/YYYY';
				}
			}
		}
		if (parseInt(threeparts[0]) > 0 && parseInt(threeparts[0]) < 32 && threeparts[0].length < 3 && threeparts[0].length > 0){
			if (parseInt(threeparts[1]) > 0 && parseInt(threeparts[1]) < 13 && threeparts[1].length < 3 && threeparts[1].length > 0){
				if (parseInt(threeparts[2]).toString() == threeparts[2] && threeparts[2].length == 4){
					return 'DD/MM/YYYY';
				}
			}
		}
	}
	else if (threeparts.length == 2) {
		if (parseInt(threeparts[0]) > 0 && parseInt(threeparts[0]) < 13 && threeparts[0].length < 3 && threeparts[0].length > 0){
			if (parseInt(threeparts[1]) > 1500 && parseInt(threeparts[1]) < 2500 && parseInt(threeparts[1]).toString() == threeparts[1]){
				return 'MM/YYYY';
			}
		}
	}
	threeparts = input_str.replace(',','').split(' ');
	if (threeparts.length == 3) {
		if (isMonth(threeparts[0])){
			if (parseInt(threeparts[1]) > 0 && parseInt(threeparts[1]) < 32 && parseInt(threeparts[1]).toString() == threeparts[1]){
				if (parseInt(threeparts[2]).toString() == threeparts[2]){
					return 'MONTH DAY, YYYY';
				}
			}
		}
		if (parseInt(threeparts[0]) > 0 && parseInt(threeparts[0]) < 32 && parseInt(threeparts[0]).toString() == threeparts[0]){
			if (isMonth(threeparts[1])){
				if (parseInt(threeparts[2]).toString() == threeparts[2]){
					return 'DAY MONTH, YYYY';
				}
			}
		}
	}
	else if (threeparts.length == 2) {
		if (isMonth(threeparts[0])){
			if (parseInt(threeparts[1]) > 1500 && parseInt(threeparts[1]) < 2500 && parseInt(threeparts[1]).toString() == threeparts[1]){
				return 'MONTH YYYY';
			}
		}
	}
	return false;
}
function getDataType(input_str,head_str){
	input_str = input_str.trim().toLowerCase();
	head_str = head_str.trim().toLowerCase();
	if (input_str.length == 0) {
		return 'Blank';
	}
	else if (parseInt(input_str).toString() == input_str){
		if (head_str.indexOf('zip') == 0 && parseInt(input_str) <10000 && parseInt(input_str) > 0) {
			return 'Zip';
		}
		return 'Int';
	}
	else if (parseInt(input_str.replace('.','')).toString() == input_str.replace('.','')){
		if (head_str.indexOf('lat') == 0 && parseFloat(input_str) < 200 && parseFloat(input_str) > -200) {
			if (head_str.length < 6 || head_str.indexOf('latitude') == 0){
				return 'Lat';
			}
		}
		else if (head_str.indexOf('lon') == 0 && parseFloat(input_str) < 200 && parseFloat(input_str) > -200) {
			if (head_str.length < 6 || head_str.indexOf('longitude') == 0){
				return 'Lon';
			}
		}
		return 'Num';
	}
	else if (isDate(input_str)){
		return 'Date';//+isDate(input_str);
	}
	else if (parseInt(input_str.replace('/','')).toString() == input_str.replace('/','')){
		return 'Num';
	}
	else if (parseInt(input_str.replace('/','').replace('.','').replace('%','')).toString() == input_str.replace('/','').replace('.','').replace('%','')){
		return 'Percent';
	}
	else if (parseInt(input_str.replace('-','')).toString() == input_str.replace('-','')){
		if (input_str.length == 10 && input_str.indexOf('-') == 5) {
			return 'Zip';
		}
		else if (input_str.length == 8 && input_str.indexOf('-') == 3) {
			return 'Phone';
		}
	}
	else if (parseInt(input_str.replace('-','').replace('-','')).toString() == input_str.replace('-','').replace('-','')){
		if (input_str.length == 12 && input_str.indexOf('-') == 3) {
			return 'Phone';
		}
	}
	else if (input_str.indexOf('www.') > -1 || input_str.indexOf('http') > -1 || (input_str.indexOf('.com') > -1 && input_str.indexOf('@') == -1)){
		return 'Link';
	}
	else if ( (input_str.indexOf('.com') > -1 || input_str.indexOf('.edu') > -1 || input_str.indexOf('.org') > -1) && input_str.indexOf('@') > -1){
		return 'Email';
	}
	else if ( (input_str.indexOf('.com') == -1 && input_str.indexOf('.edu') == -1 && input_str.indexOf('.org') == -1) && input_str.indexOf('@') == 0){
		return 'Twitter';
	}
	
	return 'Not';
}

exports.makeTypes = function(data){
	if (data.length<2){
		return [];
	}
	var datatypes = [];
	var ncols = Math.max(data[0].length,data[1].length);
	for (var i=0;i<ncols;i++){
		datatypes.push({});
	}

	var nHeaders = 1;
	var headers = [];
	for (var ii=0;ii<data[0].length;ii++) {
		var cell = data[0][ii];
		headers.push(cell);
	}
	var dataTypes = {};
	var headerLen = headers.length;
	for (var i=nHeaders;i<data.length-1;i++) {
		var len = Math.min(data[i].length,10000);
		for (var ii=0;ii<len;ii++) {
			var cell = data[i][ii];
			
			var type = getDataType(cell,headers[ii]);
			//console.log(cell, type);
			if (datatypes[ii][type]){
				datatypes[ii][type]+=1;
			}
			else {
				datatypes[ii][type]=1;
			}	
		}
	}
	var typeArray = [];
	for (var i=0;i<ncols;i++){
		var maxValue = 0;
		var maxType = '';
		for (var ii in datatypes[i]){
			if (datatypes[i][ii]>maxValue){
				maxValue = datatypes[i][ii];
				maxType = ii;
			}
		}
		typeArray.push(maxType);
	}
	return typeArray;
}