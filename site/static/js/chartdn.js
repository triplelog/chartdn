var dataFile = document.getElementById("dataFile");
var dataCopy = document.getElementById("dataCopy");
var dataUrl = document.getElementById("dataUrl");
dataCopy.style.display = 'none';
dataUrl.style.display = 'none';
function dst() {
	var radioChecked = document.querySelector("input[name=dataSourceType]:checked").value;
	if (radioChecked == 'File'){
		dataFile.style.display = 'inline-block';
		dataCopy.style.display = 'none';
		dataUrl.style.display = 'none';
	}
	else if (radioChecked == 'Copy'){
		dataCopy.style.display = 'inline-block';
		dataFile.style.display = 'none';
		dataUrl.style.display = 'none';
	}
	else if (radioChecked == 'Url'){
		dataUrl.style.display = 'inline-block';
		dataCopy.style.display = 'none';
		dataFile.style.display = 'none';
	}
}
function copyChg() {
	var dataTable = document.getElementById("dataTable");
	var csv = dataCopy.value;
	var data = Papa.parse(csv).data;
	dataTable.innerHTML = '';
	for (var i=0;i<data.length;i++){
		var newrow = document.createElement('tr');
		for (var ii=0;ii<data[i].length;ii++){
			var newcell = document.createElement('td');
			newcell.textContent = data[i][ii];
			newrow.appendChild(newcell);
		}
		dataTable.appendChild(newrow);
	}
	
	
	
}