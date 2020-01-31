var loginApp = require('./login-server.js');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/chartdn', {useNewUrlParser: true});

const https = require('https');
//const http = require('http');
var fs = require("fs");
//var myParser = require("body-parser");
var qs = require('querystring');
const { exec } = require('child_process');
var parse = require('csv-parse');
var Papa = require('papaparse');
var nunjucks = require('nunjucks');
var crypto = require("crypto");
//const flate = require('wasm-flate');
var createLine = require('./createCharts/line-charts.js');
var createBar = require('./createCharts/bar-charts.js');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};
const { PerformanceObserver, performance } = require('perf_hooks');

const User = require('./models/user');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var express = require('express');


var app = express();
app.use('/',express.static('static'));


const server1 = https.createServer(options, app);
//const server1 = http.createServer(options, app);

server1.listen(12312);


nunjucks.configure('templates', {
    autoescape: false
});

var db = mongoose.connection;
var chartSchema = new mongoose.Schema({
	id: String,
	data: String,
	options: {},
});
var Chart = mongoose.model('Chart', chartSchema);
function updateChart() {
	return '';

}

const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);

const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 8080 , origin: 'http://tabdn.com'});
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  var charts = {};
  var chartid = '';
  var dataid = '';
  var chartidtemp = '';
  var username = '';
  var myOptions = {};
  var jsonmessage = {'operation':'id','message':chartid};
  ws.send(JSON.stringify(jsonmessage));
  ws.on('message', function incoming(message) {
  	var dm = JSON.parse(message);
  	if (dm.operation == 'upload'){
  		if (chartid == ''){
  			chartid = chartidtemp;
  			dataid = chartid;
  			var defaultOptions = {};
			defaultOptions['nHeaders'] = 1;
			defaultOptions['filters'] = [];
			defaultOptions['type'] = '';
			defaultOptions['yColumns'] = '';
			defaultOptions['xColumn'] = '';
			defaultOptions['stepSizeX'] = '';
			defaultOptions['stepSizeY'] = '';
			defaultOptions['title'] = '';
			for(var k in myOptions){
				defaultOptions[k] = myOptions[k];
			}
			var chart = new Chart({id:chartid,data:dataid+'.csv',options:defaultOptions});
			chart.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved');
			});
  		}
  		//write data.csv
  		if (chartid == dataid){
			fs.writeFile("saved/"+chartid+".csv", dm.message, function (err) {
				Chart.findOne({ id: chartid }, function(err, result) {
				  if (err) {
			
				  } else {
					makeAllCharts(ws,dm,result);
				  }
				});
			});
		}
		else {
			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
			  	result.data = chartid+'.csv';
			  	dataid = chartid;
				result.markModified('data');
				result.save(function (err, result) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved new dataname');
				});
				fs.writeFile("saved/"+chartid+".csv", dm.message, function (err) {
					makeAllCharts(ws,dm,result);
				});
			  }
			});
			
		}

  	}
  	else if (dm.operation == 'download'){
  		  if (chartid == ''){
  			chartid = chartidtemp;
  			dataid = chartid;
  			var defaultOptions = {};
			defaultOptions['nHeaders'] = 1;
			defaultOptions['filters'] = [];
			defaultOptions['type'] = '';
			defaultOptions['yColumns'] = '';
			defaultOptions['xColumn'] = '';
			defaultOptions['stepSizeX'] = '';
			defaultOptions['stepSizeY'] = '';
			defaultOptions['title'] = '';
			for(var k in myOptions){
				defaultOptions[k] = myOptions[k];
			}
			var chart = new Chart({id:chartid,data:chartid+'.csv',options:defaultOptions});
			chart.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved');
			});
  		}
  		//write data.csv
  		if (chartid == dataid){
		  var wget = 'wget -O saved/'+chartid+'.csv "' + dm.message + '" && echo "done"';
		  // excute wget using child_process' exec function
		  var child = exec(wget, function(err, stdout, stderr) {
			if (err) throw err;
			else {
				fs.readFile('saved/'+chartid+'.csv', 'utf8', function(err, fileData) {
					var jsonmessage = {'operation':'downloaded','message':fileData};
					ws.send(JSON.stringify(jsonmessage));
					Chart.findOne({ id: chartid }, function(err, result) {
					  if (err) {
				
					  } else {
					  	makeAllCharts(ws,dm,result);
					  }
					});
				});
			}
		  });
		}
		else {
			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
			  	result.data = chartid+'.csv';
			  	dataid = chartid;
				result.markModified('data');
				result.save(function (err, result) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved new dataname');
				});
				  var wget = 'wget -O saved/'+chartid+'.csv "' + dm.message + '" && echo "done"';
				  // excute wget using child_process' exec function
				  var child = exec(wget, function(err, stdout, stderr) {
					if (err) throw err;
					else {
						fs.readFile('saved/'+chartid+'.csv', 'utf8', function(err, fileData) {
							var jsonmessage = {'operation':'downloaded','message':fileData};
							ws.send(JSON.stringify(jsonmessage));
							makeAllCharts(ws,dm,result);
						});
					}
				  });
			  }
			});
			
		}
  	}
  	else if (dm.operation == 'options'){
  		if (chartid == ''){
			for(var k in dm){
				if (k != 'operation'){
					myOptions[k] = dm[k];
				}
			}
  		}
  		else {
  			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
				for(var k in dm){
					if (k != 'operation'){
						result.options[k] = dm[k];
					}
				}
				result.markModified('options');
				result.save(function (err, result) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved options');
					makeAllCharts(ws,dm,result);
				});
			  }
			});
  		}
  		
  		
  		
  	}
  	else if (dm.operation == 'username'){
		  username = dm.message;
		  if (dm.chartid && dm.chartid != ""){
		  	chartid = dm.chartid;
		  	dataid = dm.dataid;
		  }
		  else {
		  	chartidtemp = dm.chartidtemp;
		  }
  	}
  	else if (dm.operation == 'view'){
		  chartid = dm.id;
		  if (chartid && chartid != ""){
			  Chart.findOne({ id: chartid }, function(err, result) {
			  	makeAllCharts(ws,dm,result);
				
			  });
		  }
  	}

  		

  });
});



loginApp.get('/browse',
	function(req, res){
		var charts = [];
		Chart.find({  }, function(err, result) {
			if (err){console.log('errrrr');}
			var charlen = Math.min(result.length,100);
			for (var i=0;i<charlen;i++){
				var mychart = {'src':result[i].id,'cols':2,'rows':1,'name':'test'};
				charts.push(mychart);
			}
			res.write(nunjucks.render('browse.html',{
				charts: charts,		
			}));
			res.end();
		});
		
		
		
    }
);
loginApp.get('/new',
	function(req, res){
		var chartid = crypto.randomBytes(50).toString('hex').substr(2, 8);
		var username = '';
		if (req.user) {
			username = req.user.username;
		}
		res.redirect('/edit/'+chartid);
    }
);
loginApp.get('/charts/:chartid',
	function(req, res){
		var chartid = req.params.chartid;
		var username = '';
		if (req.user) {
			username = req.user.username;
		}
		var start = process.hrtime();
        req.on('data', function (chunk) {
        
        });

		// when we get data we want to store it in memory
		req.on('end', () => {
				Chart.findOne({ id: chartid }, function(err, result) {
				  if (err) {
				
				  } else {
				    if (result == null){
				    	
				    }
				    else {
						var dataname = result.data;
						var myOptions = result.options;
						fs.readFile('saved/'+dataname, 'utf8', function(err, fileData) {
							var defaultData = ''
							if (!err) {defaultData = fileData;}
							var savedData = myOptions;
							var chartType = {'line':'','bar':'','scatter':'','pie':'','bubble':'','histogram':'','heatmap':'','radar':'','box':'','choropleth':'','splom':'','diff':'','calendar':''};
							if (savedData['type'] && savedData['type'] != ''){
								chartType[savedData['type']]='checked';
							}
							else {
								savedData['type']='line';
							}
							res.write(nunjucks.render('onechart.html',{
								chartScript: createChart(savedData,convertDataToFull(defaultData,savedData.nHeaders),savedData['type']), 
								dataAreaText: defaultData,
								nHeaders: savedData.nHeaders || 1,
								isChecked: chartType,
								title: savedData.title || '',
								xColumn: savedData.xColumn || '',
								yColumns: savedData.yColumns || '',
								username: username || '',
								newchartid: chartid+'a',
							}));
							res.end();
						});
					}
					
				  }
				});

		});
    }
);
loginApp.get('/edit/:chartid',
	function(req, res){
		var chartid = req.params.chartid;
		var username = '';
		if (req.user) {
			username = req.user.username;
		}
		var start = process.hrtime();
        req.on('data', function (chunk) {
        
        });

		// when we get data we want to store it in memory
		req.on('end', () => {
				Chart.findOne({ id: chartid }, function(err, result) {
				  var dataname;
				  var myOptions;
				  if (err || result == null) {
					if (chartid.length > 8) {
						Chart.findOne({ id: chartid.substr(0,chartid.length-1) }, function(err, result) {
							if (err){
							
							}
							else {
								dataname = result.data;
								myOptions = result.options;
								var newchart = new Chart({id:chartid,data:result.data,options:result.options});
								newchart.save(function (err, newchart) {
									if (err) return console.error(err);
									console.log('saved');
								});
								fs.readFile('saved/'+dataname, 'utf8', function(err, fileData) {
									var defaultData = ''
									if (!err) {defaultData = fileData;}
									var savedData = myOptions;
									var chartType = {'line':'','bar':'','scatter':'','pie':'','bubble':'','histogram':'','heatmap':'','radar':'','box':'','choropleth':'','splom':'','diff':'','calendar':''};
									if (savedData['type'] && savedData['type'] != ''){
										chartType[savedData['type']]='checked';
									}
									else {
										savedData['type']='line';
									}
									res.write(nunjucks.render('chartdn.html',{
										chartScript: createChart(savedData,convertDataToFull(defaultData,savedData.nHeaders),savedData['type']), 
										dataAreaText: defaultData,
										nHeaders: savedData.nHeaders || 1,
										isChecked: chartType,
										title: savedData.title || '',
										xColumn: savedData.xColumn || '',
										yColumns: savedData.yColumns || '',
										username: username || '',
										chartid: chartid || '',
										dataid: dataname.split('.')[0] || '',
									}));
									res.end();
								});
							}
						});
					}
					else if (chartid.length == 8) {
						res.write(nunjucks.render('chartdn.html',{
							chartScript: '', 
							dataAreaText: '',
							username: username || '',
							chartidtemp: chartid || '',
						}));
						res.end();
					}
					else {
						
						return 0;
					}
				  } 
				  else {
					dataname = result.data;
					myOptions = result.options;
					fs.readFile('saved/'+dataname, 'utf8', function(err, fileData) {
						var defaultData = ''
						if (!err) {defaultData = fileData;}
						var savedData = myOptions;
						var chartType = {'line':'','bar':'','scatter':'','pie':'','bubble':'','histogram':'','heatmap':'','radar':'','box':'','choropleth':'','splom':'','diff':'','calendar':''};
						if (savedData['type'] && savedData['type'] != ''){
							chartType[savedData['type']]='checked';
						}
						else {
							savedData['type']='line';
						}
						res.write(nunjucks.render('chartdn.html',{
							chartScript: createChart(savedData,convertDataToFull(defaultData,savedData.nHeaders),savedData['type']), 
							dataAreaText: defaultData,
							nHeaders: savedData.nHeaders || 1,
							isChecked: chartType,
							title: savedData.title || '',
							xColumn: savedData.xColumn || '',
							yColumns: savedData.yColumns || '',
							username: username || '',
							chartid: chartid || '',
							dataid: dataname.split('.')[0] || '',
						}));
						res.end();
					  });

				  }
				  
				});

		});
    }
);
const loginServer = https.createServer(options, loginApp);
loginServer.listen(3000);


function convertDataToFull(dataStr,nHeaders,usepapa=false) {
	if (usepapa){

		rawArray = [];
		var currentRow = 0;
		var t1 = performance.now();
		for (var i in dataStr) {
			var tempA = dataStr[i];
			if (!tempA){break;}
			if (currentRow >= nHeaders) {
				for (var i=0;i<tempA.length;i++) {
					var cell = tempA[i];
					if (!isNaN(parseFloat(cell))){
						if ((parseFloat(cell)%1)===0) {
							tempA[i] = parseInt(cell);
						}
						else {
							tempA[i] = parseFloat(cell);
						}
					}
				}
			}
			currentRow++;
			rawArray.push(tempA);
		}


		var filteredArray = rawArray;
		retArray = [];
		var cols = [];
		for (var i=0;i<filteredArray.length;i++) {
		
			if (i == 0){
				for (var ii=0;ii<filteredArray[i].length;ii++) {
					cols.push([]);
				}
			}
			if (i >= nHeaders) {
				var tempA = [];
				for (var ii=0;ii<filteredArray[i].length;ii++) {
					var cell = filteredArray[i][ii];
					cols[ii].push(cell);
					tempA.push(cell);
				}
				retArray.push(tempA);
			}
		
		}
		return {'byrow':retArray,'bycol':cols};
	}
	else {
		var t0 = performance.now();
	
		const parser = parse(dataStr, {
		  trim: true,
		  skip_empty_lines: true
		})
		rawArray = [];
		var currentRow = 0;
		while (2 == 2) {
			var tempA = parser.read();
			if (!tempA){break;}
			if (currentRow >= nHeaders) {
				for (var i=0;i<tempA.length;i++) {
					var cell = tempA[i];
					if (!isNaN(parseFloat(cell))){
						if ((parseFloat(cell)%1)===0) {
							tempA[i] = parseInt(cell);
						}
						else {
							tempA[i] = parseFloat(cell);
						}
					}
				}
			}
			currentRow++;
			rawArray.push(tempA);
		}


		var filteredArray = rawArray;
	
		retArray = [];
		var cols = [];
		for (var i=0;i<filteredArray.length;i++) {
		
			if (i == 0){
				for (var ii=0;ii<filteredArray[i].length;ii++) {
					cols.push([]);
				}
			}
			if (i >= nHeaders) {
				var tempA = [];
				for (var ii=0;ii<filteredArray[i].length;ii++) {
					var cell = filteredArray[i][ii];
					cols[ii].push(cell);
					tempA.push(cell);
				}
				retArray.push(tempA);
			}
		
		}
		return {'byrow':retArray,'bycol':cols};
	}
}

function createChart(alldata,csvdata,chartType="line") {

	//var frameworks = alldata.framework;
	var frameworks = ['latex','xkcd','google','plotly','chartjs'];
	var xColumn = 0;
	var yColumns = [];//parseInt(alldata.yColumns);
	if (!isNaN(parseInt(alldata.xColumn))){ xColumn = parseInt(alldata.xColumn);}
	var yCols = alldata.yColumns.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	if(yColumns.length==0){
		yColumns.push(1);
	}
	var nHeaders = parseInt(alldata.nHeaders);
	var title = alldata.title;
	var stepSizeX = alldata.stepSizeX;
	var stepSizeY = alldata.stepSizeY;
	var lineColor = alldata.lineColor;
	var dotColor = alldata.dotColor;



	if (csvdata['byrow'].length == 0){
		return '';
	}

	var fullJS = '';
	
	var chartFile = createLine;
	if (chartType == 'bar'){chartFile = createBar;}
	for (var i=0;i<frameworks.length;i++){
		var options = {'xColumn':xColumn,'yColumns':yColumns,'nHeaders':nHeaders};
		if (frameworks[i] == 'latex'){
			fullJS += '';
		}
		else if (frameworks[i] == 'xkcd'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			fullJS += chartFile.createXkcd(csvdata,options);
		}
		else if (frameworks[i] == 'google'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			fullJS += chartFile.createGoogle(csvdata,options);
		}
		else if (frameworks[i] == 'plotly'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: "'+title+'",';}
			if (stepSizeX != '' && stepSizeX != 'default') {options['xaxis'] = 'xaxis: {dtick: '+stepSizeX+'},' }
			if (stepSizeY != '' && stepSizeY != 'default') {options['yaxis'] = 'yaxis: {dtick: '+stepSizeY+'},' }
			fullJS += chartFile.createPlotly(csvdata,options);
		}
		/*
		else if (frameworks[i] == 'chartjs'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: {display: true, text: "'+title+'"},';}
			if (stepSizeX != '' && stepSizeX != 'default') {options['stepSizeX'] = 'stepSize: '+stepSizeX+',' }
			if (stepSizeY != '' && stepSizeY != 'default') {options['stepSizeY'] = 'stepSize: '+stepSizeY+',' }
			if (lineColor != '' && lineColor != 'default') {options['lineColor'] = lineColor}
			if (dotColor != '' && dotColor != 'default') {options['dotColor'] = dotColor}
		
			fullJS += chartFile.createChartjs(csvdata,options);
		}*/
	}




	return fullJS;
}
				
function makeAllCharts(ws,dm,result) {
	var t0 = performance.now();
	fs.readFile('saved/'+result.data, 'utf8', function(err, fileData) {
		var results = Papa.parse(fileData, {
			complete: function(results) {
				var nHeaders = result.options.nHeaders || 1;
				var data = convertDataToFull(results.data,nHeaders,true);
				var datasets = datasetsChartjs(data,result.options);
				var chartjsOptions = {'datasets':datasets};
				//{'datasets':[{"label":"Label","data":[{"x":1,"y":2},{"x":2,"y":3},{"x":3,"y":2}],"fill":false}]};
				var chartJSON = {
					type: 'line',
					data: {
						datasets: chartjsOptions['datasets'],
					},
					options: {
						scales: {
							yAxes: [{
								ticks: {
									beginAtZero: true,
					
								}
							}],
							xAxes: [{
								type: 'linear',
								position: 'bottom',
								ticks: {
					
								}
							}]
						},
		
	
					}
				};
				if (!dm.loc){dm.loc = 0}
				var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc};
				ws.send(JSON.stringify(jsonmessage));
				var t1 = performance.now();
				console.log('-a-');
				console.log(t0);
				console.log(t1);
			}
		});
	});

	
}

function datasetsChartjs(data,options) {
	var datasets = [];
	if (!options['yColumns']){return [];}
	if (!options['xColumn']){return [];}
	var xColumn = 0;
	var yColumns = [];
	if (!isNaN(parseInt(options.xColumn))){ xColumn = parseInt(options.xColumn);}
	var yCols = options.yColumns.split(',');
	for (var i=0;i<yCols.length;i++){
		if (!isNaN(parseInt(yCols[i]))){ yColumns.push(parseInt(yCols[i]));}
	}
	if(yColumns.length==0){
		yColumns.push(1);
	}
	for (var i=0;i<yColumns.length;i++){
		var newdataset = {'label':'Label','data':[],'fill':false};
		for (var ii=0;ii<data['bycol'][yColumns[i]].length;ii++){
			newdataset['data'].push({'x':data['bycol'][xColumn][ii], 'y':data['bycol'][yColumns[i]][ii]});
		}
		if (options.lineColor) {newdataset['borderColor']=lineColor}
		if (options.dotColor) {newdataset['backgroundColor']=dotColor}
			
		datasets.push(newdataset);
	}
	return datasets;
}