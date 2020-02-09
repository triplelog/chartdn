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
var createPlotly = require('./createCharts/plotly-charts.js');
var createXkcd = require('./createCharts/xkcd-charts.js');
var createGoogle = require('./createCharts/google-charts.js');
var createChartjs = require('./createCharts/chartjs-charts.js');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};
const { PerformanceObserver, performance } = require('perf_hooks');
const {VM, VMScript} = require('vm2');

const vm = new VM();



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
	user: String,
});
var Chart = mongoose.model('Chart', chartSchema);


const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);

const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 8080 , origin: 'http://tabdn.com'});
const wss = new WebSocket.Server({ server });

function updateOptions(oldOptions, newOptions) {
	for(var k in newOptions){
		var v = newOptions[k];
		if (k == 'yColumns'){
			oldOptions[k] = v;
		}
		else if (k == 'lines'){
			for (var vvv in v){
				var vv = v[vvv];
				if (!oldOptions['lines']){oldOptions['lines']=[];}
				var noObject = true;
				for (var i=0;i<oldOptions['lines'].length;i++){
					if (oldOptions['lines'][i].id == vv.id){
						for (var key in vv){
							if (key != 'passive' && (!vv['passive'] || !oldOptions['lines'][i][key]) ){
								oldOptions['lines'][i][key] = vv[key];
							}
						}
						noObject = false;
						break;
					}
				}
				if (noObject){
					oldOptions['lines'].push(vv);
				}
			}
		}
		else if (Array.isArray(v)){
			if (!oldOptions[k]){oldOptions[k]=[];}
			for (var i=0;i<v.length;i++){
				if (!oldOptions[k][i]){oldOptions[k].push({});}
				for (var key in v[i]){
					oldOptions[k][i][key] = v[i][key];
				}
			}
		}
		else if (v && typeof v === 'object' && v.constructor === Object){
			if (!oldOptions[k]){oldOptions[k]={};}
			for (var key in v){
				oldOptions[k][key] = v[key];
			}
		}
		else if (k != 'operation'){
			oldOptions[k] = v;
		}
	}
}
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
			defaultOptions['filters'] = {'disabled':[],'enabled':[]};
			defaultOptions['type'] = '';
			defaultOptions['yColumns'] = [];
			defaultOptions['xColumn'] = '';
			defaultOptions['stepSize'] = {};
			defaultOptions['labels'] = {};
			defaultOptions['title'] = '';
			for(var k in myOptions){
				defaultOptions[k] = myOptions[k];
			}
			var chart = new Chart({id:chartid,data:dataid+'.csv',options:defaultOptions,user:username});
			chart.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved');
			});
			if (username != '') {
				User.findOne({username: username}, function(err, result) {
				  if (err) {
			
				  } else {
					result.charts.push(chartid);
					result.markModified('charts');
					result.save(function (err, result) {
						if (err) return console.error('sajdhfkasdhj\n',err);
						console.log('updated user charts');
					});
				  }
				});
			}
  		}
  		//write data.csv
  		if (chartid == dataid){
			fs.writeFile("saved/"+chartid+".csv", dm.message, function (err) {
				Chart.findOne({ id: chartid }, function(err, result) {
				  if (err) {
			
				  } else {
					makeAllCharts(ws,dm,result,'all');
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
					makeAllCharts(ws,dm,result,'all');
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
			defaultOptions['filters'] = {'disabled':[],'enabled':[]};
			defaultOptions['type'] = '';
			defaultOptions['yColumns'] = [];
			defaultOptions['xColumn'] = '';
			defaultOptions['stepSize'] = {};
			defaultOptions['labels'] = {};
			defaultOptions['title'] = '';
			for(var k in myOptions){
				defaultOptions[k] = myOptions[k];
			}
			var chart = new Chart({id:chartid,data:chartid+'.csv',options:defaultOptions,user:username});
			chart.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved');
			});
			if (username != '') {
				User.findOne({username: username}, function(err, result) {
				  if (err) {
			
				  } else {
					result.charts.push(chartid);
					result.markModified('charts');
					result.save(function (err, result) {
						if (err) return console.error('sajdhfkasdhj\n',err);
						console.log('updated user charts');
					});
				  }
				});
			}
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
					  	makeAllCharts(ws,dm,result,'all');
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
							makeAllCharts(ws,dm,result,'all');
						});
					}
				  });
			  }
			});
			
		}
  	}
  	else if (dm.operation == 'options'){
  		if (chartid == ''){
			updateOptions(myOptions, dm);
  		}
  		else {
  			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
				updateOptions(result.options, dm);
				updateOptions(myOptions, dm);
				result.markModified('options');
				result.save(function (err, result) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved options');
					console.log(JSON.stringify(result));
					makeAllCharts(ws,dm,result,'all');
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
			  	if (err || result == null){
			  	}
			  	else {
					if (dm.style){
						makeAllCharts(ws,dm,result,dm.style);
					}
					else {
						makeAllCharts(ws,dm,result,'all');
					}
			  	}
				
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
        res.write(nunjucks.render('onechart.html',{
			username: username || '',
			newchartid: chartid+'a',
			chartid: chartid,
		}));
		res.end();
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
								var newchart = new Chart({id:chartid,data:result.data,options:result.options,user:username});
								newchart.save(function (err, newchart) {
									if (err) return console.error(err);
									console.log('saved');
								});
								if (username != '') {
									User.findOne({username: username}, function(err, result) {
									  if (err) {
			
									  } else {
										result.charts.push(chartid);
										result.markModified('charts');
										result.save(function (err, result) {
											if (err) return console.error('sajdhfkasdhj\n',err);
											console.log('updated user charts');
										});
									  }
									});
								}
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
										chartScript: '',
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
					if (result.user == '' || result.user == username){
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
								chartScript: '',
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
					  else {
					  	res.redirect('/charts/'+chartid);
					  }

				  }
				  
				});

		});
    }
);
const loginServer = https.createServer(options, loginApp);
loginServer.listen(3000);


function convertDataToFull(dataStr,nHeaders) {
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
	var t2 = performance.now();
	const script = new VMScript("for (var i=0;i<1000000;i++) {var x = Math.random()+i;}");
	var t3 = performance.now();
	var vmresult = vm.run(script);//30-230
	var t4 = performance.now();
	var fib = function(n) {
	  if (n <= 1) { return 1; }
	  return fib(n - 1) + fib(n - 2);
	};

	console.log(fib(20));
	var t5 = performance.now();
	for (var i=0;i<1000000;i++) {var xx = Math.random()+i;};//.7-5.5-53
	var t6 = performance.now();
	let vmresult3 = vm.run("for (var i=0;i<1000000;i++) {var xxx = Math.random()+i;}");//30-220-2106
	var t7 = performance.now();
	eval("for (var i=0;i<1000000;i++) {var xxx = Math.random()+i;}");//6.5-41-613
	var t8 = performance.now();
	
	
	for (var i=0;i<10;i++){
		var wget = './a.out';
		var child = exec(wget, function(err, stdout, stderr) {
			console.log(stdout);
			var t9 = performance.now();
			console.log(t8,t9);//40-76-94--650 for 10 fib(20) in js
		});
	}
	console.log(t2,t3,t4,t5,t6,t7,t8);
	//Run filters

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
			
function makeAllCharts(ws,dm,chartInfo,chartStyle='all') {
	var t0 = performance.now();
	fs.readFile('saved/'+chartInfo.data, 'utf8', function(err, fileData) {
		var results = Papa.parse(fileData, {
			complete: function(results) {
				var nHeaders = chartInfo.options.nHeaders || 1;
				var data = convertDataToFull(results.data,nHeaders);
				/*
				if (chartStyle == 'all' || chartStyle == 'chartJS') {
					var chartJSON = createChartjs.createChartjs(data,chartInfo.options);
					if (!dm.loc){dm.loc = 0}
					var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'chartJS'};
					ws.send(JSON.stringify(jsonmessage));
				}
				var t1 = performance.now();
				if (chartStyle == 'all' || chartStyle == 'XKCD') {
					var chartJSON = createXkcd.createXkcd(data,chartInfo.options);
					if (!dm.loc){dm.loc = 0}
					var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'XKCD'};
					ws.send(JSON.stringify(jsonmessage));
				}
				var t2 = performance.now();
				if (chartStyle == 'all' || chartStyle == 'google') {
					var chartJSON = createGoogle.createGoogle(data,chartInfo.options);
					if (!dm.loc){dm.loc = 0}
					var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'google'};
					ws.send(JSON.stringify(jsonmessage));
				}*/
				var t3 = performance.now();
				if (chartStyle == 'all' || chartStyle == 'plotly') {
					var chartJSON = createPlotly.createPlotly(data,chartInfo.options);
					if (!dm.loc){dm.loc = 0}
					var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'plotly'};
					ws.send(JSON.stringify(jsonmessage));
				}
				var t4 = performance.now();
				console.log('-a-');
				console.log(t0);
				//console.log(t1);
				//console.log(t2);
				console.log(t3);
				console.log(t4);
			}
		});
	});

	
}

