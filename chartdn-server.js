

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/chartdn', {useNewUrlParser: true});

var fromLogin = require('./login-server.js');
var loginApp = fromLogin.loginApp;
var tempKeys = fromLogin.tempKeys;
var Chart = fromLogin.Chart;

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
const pako = require('pako');
const atob = require('atob');
const btoa = require('btoa');
var toUint8Array = require('base64-to-uint8array')
var createPlotly = require('./createCharts/plotly-charts.js');
var createXkcd = require('./createCharts/xkcd-charts.js');
var createGoogle = require('./createCharts/google-charts.js');
var createChartjs = require('./createCharts/chartjs-charts.js');
var modJS = require('./modify.js');
//var datatypes = require('./datatypes.js');

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



const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);

const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 8080 , origin: 'http://tabdn.com'});
const wss = new WebSocket.Server({ server });


function updateData(oldDataStr,delimiter,chartid,ws,dm,cpptable){
	var results = Papa.parse(oldDataStr, {
		delimiter: delimiter,
		skipEmptyLines: false,
	});
	var nHeaders = 1;
	var newColumns = [];
	var deleteColumns = [];
	var chgRows = [];
	for (var i=0;i<dm.message.length;i++){
		if (dm.message[i].col){
			var cellData = dm.message[i];
			if (cellData.row+nHeaders<results.data.length){
				results.data[cellData.row+nHeaders][parseInt(cellData.col.substring(3))] = cellData.value;
			}
			else {
				results.data[cellData.row+nHeaders] = [];
				results.data[cellData.row+nHeaders][parseInt(cellData.col.substring(3))] = cellData.value;
			}
		}
		else if (dm.message[i].newColumns){
			newColumns = dm.message[i].newColumns;
		}
		else if (dm.message[i].deleteColumn){
			deleteColumns.push(dm.message[i].deleteColumn);
		}
		else {
			chgRows.push(dm.message[i]);
		}
	}
	for (var i=0;i<deleteColumns.length;i++){
		if (newColumns.length == 0){
			for (var ii=0;ii<results.data[0].length;ii++){
				if (ii != deleteColumns[i]){
					newColumns.push(ii);
				}
			}
		}
		else {
			for (var ii=0;ii<newColumns.length;ii++){
				if (newColumns[ii] == deleteColumns[i]){
					newColumns.splice(ii,1);
					break;
				}
			}
		}
	}
	var originalRows = {};
	for (var i=0;i<chgRows.length;i++){
		if (chgRows[i].originalRow+nHeaders < results.data.length){
			originalRows[chgRows[i].originalRow] = {'row':results.data[chgRows[i].originalRow+nHeaders].slice(),'index':chgRows[i].originalRow+nHeaders};
		}
		else if (chgRows[i].originalRow+nHeaders == results.data.length) {
			results.data.push(['','']);
			originalRows[chgRows[i].originalRow] = {'row':['',''],'index':chgRows[i].originalRow+nHeaders};
		}
		else {
			console.log('results not big enough!');
			results.data[chgRows[i].originalRow+nHeaders] = [];
			originalRows[chgRows[i].originalRow] = {'row':[],'index':chgRows[i].originalRow+nHeaders};
		}
	}
	for (var i=0;i<chgRows.length;i++){
		var cIndex = originalRows[chgRows[i].originalRow].index;
		results.data.splice(cIndex,1);
		if (chgRows[i].newRow != -1){
			results.data.splice(chgRows[i].newRow+nHeaders,0,originalRows[chgRows[i].originalRow].row);
			originalRows[chgRows[i].originalRow].index = chgRows[i].newRow+nHeaders;
		}
		
		//update other originalRow index
		var nomas = {};
		nomas[chgRows[i].originalRow]=true;
		for (var ii=i+1;ii<chgRows.length;ii++){
			if (!nomas[chgRows[ii].originalRow]){
				
				if (originalRows[chgRows[ii].originalRow].index > cIndex) {
					if (chgRows[i].newRow == -1) {
						originalRows[chgRows[ii].originalRow].index--;
					}
					else if (originalRows[chgRows[ii].originalRow].index <= chgRows[i].newRow+nHeaders) {
						originalRows[chgRows[ii].originalRow].index--;
					}
				}
				else if (originalRows[chgRows[ii].originalRow].index < cIndex) {
					if (originalRows[chgRows[ii].originalRow].index >= chgRows[i].newRow+nHeaders) {
						originalRows[chgRows[ii].originalRow].index++;
					}
				}
				nomas[chgRows[ii].originalRow]= true;
			}
		}
	}
	var file = fs.createWriteStream('saved/'+chartid+'.csv');
	file.on('error', function(err) { /* error handling */ });
	/*if (newColumns.length == 0){
		file.write(Papa.unparse(results.data))
	}
	else {
		var vv = [];
		var i=0;
		for (i=0;i<newColumns.length;i++){
			vv.push(v[newColumns[i]]);
		}
		file.write(Papa.unparse(vv) + '\n');
	}*/
	results.data.forEach(function(v) { 
		if (newColumns.length == 0){
			var newLine = '';
			var i=0;
			for (i=0;i<v.length-1;i++){
				if (v[i].indexOf('|')>-1){
					newLine += '"'+v[i]+'"| ';
				}
				else {
					newLine += v[i]+'| ';
				}
			}
			if (v[i].indexOf('|')>-1){
				newLine += '"'+v[i]+'"\n';
			}
			else {
				newLine += v[i]+'\n';
			}
			file.write(newLine);
		}
		else {
			var newLine = '';
			var i=0;
			for (i=0;i<newColumns.length-1;i++){
				if (newColumns[i]<v.length){
					if (v[newColumns[i]].indexOf('|')>-1){
						newLine += '"'+v[newColumns[i]]+'"| ';
					}
					else {
						newLine += v[newColumns[i]]+'| ';
					}
				}
				else {
					newLine += '| ';
				}
			}
			if (newColumns[i]<v.length){
				if (v[newColumns[i]].indexOf('|')>-1){
					newLine += '"'+v[newColumns[i]]+'"\n';
				}
				else {
					newLine += v[newColumns[i]]+'\n';
				}
			}
			else {
				newLine += '\n';
			}
			file.write(newLine);
		}
	});
	file.end();
	return loadChart(chartid,ws,dm,cpptable,false,false);
}
function updateOptions(oldOptions, newOptions) {
	for(var k in newOptions){
		
		var v = newOptions[k];
		if (k == 'yColumns' || k == 'tags'){
			oldOptions[k] = v;
		}
		else if (k == 'nsteps'){
			if (v < 0){delete oldOptions[k];}
			else {oldOptions[k] = v;}
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
function updatePermissions(oldUser, newOptions) {
	for(var k in newOptions){
		
		var v = newOptions[k];
		if (k == 'viewPermissions'){
			oldUser['view'] = v;
		}
		else if (k == 'forkPermissions'){
			oldUser['fork'] = v;
		}
		else if (k == 'editPermissions'){
			oldUser['edit'].all = v;
		}
	}
}
wss.on('connection', function connection(ws) {
  var charts = {};
  var chartid = '';
  var delimiter = '';
  var dataid = '';
  var chartidtemp = '';
  var username = '';
  var myOptions = {};
  var chartData = false;
  var mongoChart = {};
  var sendTable = true;
  var cpptable = require('./dataaddon/datatypes.js');
  ws.on('message', function incoming(message) {
  	var dm = JSON.parse(message);
  	console.log(dm.operation);
  	if (dm.operation == 'upload'){
  		var d = new Date(); var n = d.getTime(); console.log('time2: ', n);

  		//write data.csv
  		var d = new Date(); var n = d.getTime(); console.log('time3: ', n);
  		if (chartid != dataid){
  			Chart.updateOne({ id: chartid }, {data: chartid+'.csv'}, function(err, result) {});
  			dataid = chartid;
  		}
  		
		var t0 = performance.now();
		var fstr = '';
		if (!dm.type || dm.type == 'csv'){
			var strData = atob(dm.message);
			var charData = strData.split('').map(function(x){return x.charCodeAt(0);});
			var binData = new Uint8Array(charData);
			var pakores = pako.inflate(binData,{to:'string'});
			
			if (dm.isString){
				fstr = pakores;
			}
			else {
				fstr = atob(pakores);
			}
		}
		else if (dm.type == 'xls' || dm.type == 'xlsx'){
			fstr = dm.message;
		}
		
		var d = new Date(); var n = d.getTime(); console.log('time4: ', n);
		
		if (dm.type == 'xls' || dm.type == 'xlsx'){
			fs.writeFile("saved/"+chartid+"."+dm.type, fstr, {encoding: 'base64'}, function(err) {
				var wget = 'in2csv saved/'+chartid+"."+dm.type+" > saved/"+chartid+".csv";
				var child = exec(wget, function(err, stdout, stderr) {
					if (err) throw err;
					else {
						chartData = loadChart(chartid,ws,dm,cpptable,true,false);
						
					}
					
				});
			});
		}
		else {
			fs.writeFile("saved/"+chartid+".csv", fstr, function (err) {
				chartData = loadChart(chartid,ws,dm,cpptable,false,false);

			});
		}
		
		delete mongoChart[chartid];
		chartData = false;
  	}
  	else if (dm.operation == 'download'){
  		
  		if (chartid != dataid){
  			Chart.updateOne({ id: chartid }, {data: chartid+'.csv'}, function(err, result) {});
  			dataid = chartid;
  		}
  		
		var wget = 'wget -O saved/'+chartid+'.csv "' + dm.message + '" && echo "done"';
		if (!dm.type || dm.type == 'csv') {
		
		}
		else {
			wget = 'wget -O saved/'+chartid+'.'+dm.type+' "' + dm.message + '" && in2csv saved/'+chartid+'.'+dm.type+' > saved/'+chartid+'.csv && rm saved/'+chartid+'.'+dm.type;
		}
		var child = exec(wget, function(err, stdout, stderr) {
			if (err) throw err;
			else {
				loadChart(chartid,ws,dm,cpptable,false,false);
				//fs.readFile('saved/'+chartid+'.csv', 'utf8', function(err, fileData) {
					//var jsonmessage = {'operation':'downloaded','message':fileData};
					//ws.send(JSON.stringify(jsonmessage));
					//loadChart(chartid,ws,dm,cpptable,false,false);
				//});
			}
		});

		delete mongoChart[chartid];
		chartData = false;
  	}
  	else if (dm.operation == 'dataupdate'){
		dm.delimiter = '|';
  		if (chartid != dataid){
  			Chart.updateOne({ id: chartid }, {data: chartid+'.csv', "options.delimiter":'|'}, function(err, result) {});
		}
		else if (delimiter != '|'){
			Chart.updateOne({ id: chartid }, {"options.delimiter":'|'}, function(err, result) {});
			
		}
		fs.readFile('saved/'+dataid+'.csv', 'utf8', function(err, fileData) {
			updateData(fileData,delimiter,chartid,ws,dm,cpptable);
			dataid = chartid;
			delimiter = '|';
		});
		delete mongoChart[chartid];
		chartData = false;
  	}
  	else if (dm.operation == 'options'){
  		console.log('message rec', dm,performance.now());
  		if (chartid == ''){
			updateOptions(myOptions, dm);
  		}
  		else if (mongoChart[chartid]) {
  				var result = mongoChart[chartid];
  				console.log('Chart Found',performance.now());
				updateOptions(result.options, dm);
				updateOptions(myOptions, dm);
				result.markModified('options');
				result.save(function (err, result2) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved options', result.options, performance.now());
				});
				if (!chartData){
					makeAllCharts(ws,dm,result,'all',false,true,cpptable).then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					if (dm.nsteps || dm.nsteps === 0){
						makeChartsWithData(ws,chartData,result,'all',dm,true,cpptable);
					}
					else {
						makeChartsWithData(ws,chartData,result,'all',dm,false,cpptable);
					}
					
				}
  		}
  		else {
  			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
			  	console.log('Chart Found',performance.now());
				updateOptions(result.options, dm);
				updateOptions(myOptions, dm);
				result.markModified('options');
				result.save(function (err, result2) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved options', performance.now());
				});
				mongoChart[chartid] = result;
				if (!chartData){
					makeAllCharts(ws,dm,result,'all',false,true,cpptable).then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					if (dm.nsteps || dm.nsteps === 0){
						makeChartsWithData(ws,chartData,result,'all',dm,true,cpptable);
					}
					else {
						makeChartsWithData(ws,chartData,result,'all',dm,false,cpptable);
					}
					
				}
				
			  }
			});
  		}
  		
  		
  		
  	}
  	else if (dm.operation == 'permissions'){
  		console.log('message rec',performance.now());
  		if (mongoChart[chartid]) {
  				var result = mongoChart[chartid];
  				console.log('Chart Found',performance.now());
  				if (result.users.creator == username){
					updatePermissions(result.users, dm);
					result.markModified('users');
					result.save(function (err, result2) {
						if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
						console.log('saved options', result2.users, performance.now());
					});
				}
  		}
  		else {
  			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
			  	console.log('Chart Found',performance.now());
			  	if (result.users.creator == username){
					updatePermissions(result.users, dm);
					result.markModified('users');
					result.save(function (err, result2) {
						if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
						console.log('saved options', performance.now(), result2.users);
					});
					mongoChart[chartid] = result;
				}
			  }
			});
  		}
  	}
  	else if (dm.operation == 'modifiers'){
  		console.log('message rec',performance.now());
  		if (chartid == '') {return;}
  		if (mongoChart[chartid]) {
  				var result = mongoChart[chartid];
  				console.log('Chart Found',performance.now());
			  	result.modifiers = dm.message;
				result.markModified('modifiers');
				result.save(function (err, result2) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved modifiers', performance.now());
				});
				if (!chartData){
					makeAllCharts(ws,dm,result,'all',false,true,cpptable).then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					makeChartsWithData(ws,chartData,result,'all',dm,true,cpptable);
					
				}
  		}
  		else {
  			Chart.findOne({ id: chartid }, function(err, result) {
			  if (err) {
				
			  } else {
			  	console.log('Chart Found',performance.now());
			  	result.modifiers = dm.message;
				result.markModified('modifiers');
				result.save(function (err, result2) {
					if (err) return console.error('sajdhfkasdhjfkjsahdfkjsadhfs\n',err);
					console.log('saved modifiers', performance.now());
				});
				mongoChart[chartid] = result;
				if (!chartData){
					makeAllCharts(ws,dm,result,'all',false,true,cpptable).then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					makeChartsWithData(ws,chartData,result,'all',dm,true,cpptable);
					
				}
			  }
			});
  		}
  		
  		
  		
  	}
  	else if (dm.operation == 'key'){
		  username = tempKeys[dm.message].username;
		  if (tempKeys[dm.message].dataid){
		  	dataid = tempKeys[dm.message].dataid;
		  }
		  if (tempKeys[dm.message].sendTable == 'yes'){
		  	sendTable = true;
		  }
		  else if (tempKeys[dm.message].sendTable == 'no'){
		  	sendTable = false;
		  }
		  if (dm.chartid && dm.chartid != ""){
		  	chartid = dm.chartid;
		  }
		  else if (tempKeys[dm.message].chartidtemp){
		  	chartidtemp = tempKeys[dm.message].chartidtemp;
		  }
		  
  	}
  	else if (dm.operation == 'friend'){
		  var friend = dm.message;
		  var me = username;
		  User.countDocuments({username: friend}, function(err, result) {
		  	if (err){return}
		  	else if (result > 0){
		  		User.updateOne({username: me, friends: { "$ne": friend}}, {$push: {friends: friend}}, function (err2, result2) {
		  			if (err2 || !result2 || result2.n == 0){return}
		  			else {
						console.log('new friend');
						User.updateOne({username: friend, followers: { "$ne": me}}, {$push: {followers: me}}, function (err3, result3) {})
						var jsonmessage = {'operation':'friend','message':friend};
						ws.send(JSON.stringify(jsonmessage));
					}
		  		});
		  	}
		  }).limit(1);
		  
  	}
  	else if (dm.operation == 'view'){
		  chartid = dm.id;
		  if (chartid && chartid != ""){
			  Chart.findOne({ id: chartid }, function(err, result) {
			  	if (err || result == null){
			  	}
			  	else if (result.users.view[0]=='any' || result.users.creator == username){
			  		delimiter = result.options.delimiter;
			  		if (result.data != ''){
			  			mongoChart[chartid] = result;
						if (!dm.style){
							dm.style = 'all';
						}
						if (!chartData){
							makeAllCharts(ws,dm,result,dm.style,false,sendTable,cpptable).then(function(result3) {
								chartData = result3.data;
							}, function(err) {
								console.log(err);
							});
				
						}
					}
			  	}
			  	else if (result.users.view[0] == 'friends' && username != ''){
			  		 delimiter = result.options.delimiter;
			  		 User.countDocuments({username: username, followers: result.users.creator}, function(err, result2) {
						if (err){return}
						else if (result2 > 0 && result.data != ''){
							mongoChart[chartid] = result;
							if (!dm.style){
								dm.style = 'all';
							}
							if (!chartData){
								makeAllCharts(ws,dm,result,dm.style,false,sendTable,cpptable).then(function(result3) {
									chartData = result3.data;
								}, function(err) {
									console.log(err);
								});
				
							}
						}
			  		
			  		})
			  	}
			  });
		  }
  	}
  	else if (dm.operation == 'qr'){
  		var dotnet = 'dotnet python/qr-art/src/qr-art/bin/Debug/netcoreapp3.1/qr-art.dll "https://chartdn.com/charts/yoigjmppb" static/images/outline.png png static/images/newqr.png -t 6 -e L';
		console.log('making qr', performance.now());
		var child = exec(dotnet, function(err, stdout, stderr) {
			if (err) throw err;
			else {
				console.log('made qr',performance.now());
				
			}
			
		});
		  		  
  	}
  	else if (dm.operation == 'search'){
		  var k = dm.key;
		  var tags = dm.tags;
		  console.log('search for charts',performance.now());
		  User.findOne({username:username}, 'charts', function(err, result) {
		  	var c = result.charts[k];
		  	Chart.find({id: {$in: c}, 'options.tags': {$all: tags}}, 'id', function(err, result2) {
		  		console.log('found them ',performance.now());
		  		var jsonmessage = {'operation':'result','message':result2,'key':k};
				ws.send(JSON.stringify(jsonmessage));
			}).limit(25);
		  })
		  
  	}

  		

  });
});

function loadChart(chartid,ws,dm,cpptable,deletexls=false,result=false){
	if (deletexls){
		fs.unlink("saved/"+chartid+"."+dm.type, (err) => {
			if (err){
				console.log('Did not delete xls file');
			}
		});
	}
	if (result){
		makeAllCharts(ws,dm,result,'all',true,true,cpptable).then(function(result3) {
			chartData = result3.data;
			result.types = result3.types;
			result.markModified('types');
			result.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved',chart.types.slice(0,10));
			});
			return chartData;
		}, function(err) {
			console.log(err);
			return false;
		});
	}
	else {
		Chart.findOne({ id: chartid }, function(err, result2) {
		  if (err) {
		
		  } else {
		  	
			makeAllCharts(ws,dm,result2,'all',true,true,cpptable).then(function(result3) {
				chartData = result3.data;
				result2.types = result3.types;
				result2.markModified('types');
				result2.save(function (err, chart) {
					if (err) return console.error(err);
					console.log('saved types',chart.types.slice(0,10));
				});
				return chartData;
			}, function(err) {
				console.log(err);
				return false;
			});
			
		  }
		});
	}
	

}

loginApp.get('/browse',
	function(req, res){
		var charts = [];
		console.log('start looking: ', performance.now());
		var username = '';
		if (req.isAuthenticated() && req.user){
			username = req.user.username;
		}
		var query = {'users.view': 'any'};
		if (req.query.tags && req.query.creators) {
			var tags = req.query.tags.split(',');
			var creators = req.query.creators.split(',');
			var followers = [];
			if (req.isAuthenticated() && req.user){
				followers = req.user.followers;
			}
			query = { "options.tags": { $all: tags }, "users.creator": { $in: creators }, $or: [{'users.view': 'any'}, {'users.view': 'friends', 'users.creator': { $in: followers }}] };
		}
		else if (req.query.tags) {
			var tags = req.query.tags.split(',');
			var followers = [];
			if (req.isAuthenticated() && req.user){
				followers = req.user.followers;
			}
			query = { "options.tags": { $all: tags }, $or: [{'users.view': 'any'}, {'users.view': 'friends', 'users.creator': { $in: followers }}]};
		}
		else if (req.query.creators) {
			var creators = req.query.creators.split(',');
			var followers = [];
			if (req.isAuthenticated() && req.user){
				followers = req.user.followers;
			}
			query = { "users.creator": { $in: creators }, $or: [{'users.view': 'any'}, {'users.view': 'friends', 'users.creator': { $in: followers }}] };

		}
		Chart.find(query, function(err, result) {
			if (err){console.log('errrrr');}
			console.log('found them: ', performance.now());
			var charlen = Math.min(result.length,25);
			for (var i=0;i<charlen;i++){
				var cols = 3; var rows = 1;
				var shape = result[i].options.shapeChart;
				if (shape == 'square'){
					cols = 2; rows = 2;
				}
				else if (shape == 'tall'){
					cols = 1; rows = 3;
				}
				var mychart = {'src':result[i].id,'cols':cols,'rows':rows,'name':'test'};
				charts.push(mychart);
			}
			var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
			tempKeys[tkey] = {username:username,sendTable:'no'};
			res.write(nunjucks.render('browse.html',{
				charts: charts,
				tags: req.query.tags,
				creators: req.query.creators,
				tkey: tkey,
			}));
		
			res.end();
		}).limit(25);

		
    }
);
loginApp.get('/new',
	function(req, res){
		var username = '';
		
		var chartid = parseInt(crypto.randomBytes(50).toString('hex'),16).toString(36).substr(2, 8);
		var defaultOptions = {};
		defaultOptions['nHeaders'] = 1;
		defaultOptions['type'] = '';
		defaultOptions['yColumns'] = [];
		defaultOptions['xColumn'] = '';
		defaultOptions['stepSize'] = {};
		defaultOptions['scale'] = {};
		defaultOptions['labels'] = {};
		defaultOptions['title'] = '';
		defaultOptions['delimiter'] = '';
		if (req.user) {
			username = req.user.username;
			User.updateOne({username: username, "charts.created": { "$ne": chartid}}, {$push: {"charts.created": chartid}}, function (err, result) {});
		}
		var chart = new Chart({id:chartid,data:'',options:defaultOptions,users:{creator:username,view:['any'],fork:['any'],edit:{all:['private']}},modfiers:[],types:[],stats:{time:Date.now(),views:{},forks:[]}});
		chart.save(function (err, chart) {
			if (err) {
				console.log(err);
				chartid = parseInt(crypto.randomBytes(50).toString('hex'),16).toString(36).substr(2, 8);
				var chart2 = new Chart({id:chartid,data:'',options:defaultOptions,users:{creator:username,view:['any'],fork:['any'],edit:{all:['private']}},modfiers:[],types:[],stats:{time:Date.now(),views:{},forks:[]}});
				chart2.save(function (err, chart2) {
					if (err) {
						console.log('second error', err);
				
					};
					console.log('new chart created');
					
					res.redirect('/edit/'+chartid);
				});	
				
			}
			else {
				console.log('new chart created', chart);
				res.redirect('/edit/'+chartid);
			}
		});			
		//Create chart here


		
    }
);
loginApp.get('/charts/:chartid',
	function(req, res){
		var chartid = req.params.chartid;
		var username = '';
		if (req.user) {
			username = req.user.username;
			console.log('look for user ',performance.now());
			User.updateOne({username: username}, {$pull: {"charts.viewed": chartid}}, function (err, result) {
				console.log('removed chart ',performance.now());
				User.updateOne({username: username}, {$push: {"charts.viewed": chartid}}, function (err2, result2) {
					console.log('added chart ',performance.now());
				});
			});
			/*var largeChartArray = [];
			for (var i=0;i<7000;i++){
				var cid = crypto.randomBytes(100).toString('hex').substr(2, 8);
				largeChartArray.push(cid);
			}
			User.updateOne({username: username, "charts.viewed": { "$ne": chartid}}, {"charts.viewed": largeChartArray}, function (err, result) {});*/

		}
		Chart.updateOne({id: chartid},{$inc: {'stats.views.total':1}}, function(err, result) {});
		console.log('look for chart ',performance.now());
		Chart.findOne({id: chartid},'users', function(err, result) {
			var editable = false;
			var forkable = false;
			var viewable = false;
			if (result.users.creator == username){
				editable = true;
			}
			if (result.users.view[0] == 'any'){
				viewable = true;
			}
			if (result.users.fork[0] == 'any'){
				forkable = true;
			}
			//Check if viewable
			//Check if forkable
			//Check if editable
			console.log('found chart ',performance.now());
			var start = process.hrtime();
			var title = 'ChartDN Chart';
			var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
			tempKeys[tkey] = {username:username,sendTable:'no'};
			tempKeys[tkey].chartid = chartid;
			res.write(nunjucks.render('onechart.html',{
				username: username || '',
				chartid: chartid,
				title: title,
				tkey:tkey,
				editable: editable,
				forkable: forkable,
				viewable: viewable,
			}));
			res.end();
		});
		
    }
);
loginApp.get('/fork/:chartid',
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
			Chart.findOne({ id: chartid }, function(err, result2) {
				if (err){}
				else { //Fork chart data and options
					if (result2.users.fork[0] == 'any' || result2.users.creator == username) {
						if (!result2.stats.forks){
							var nforks = 0;
							chartid = chartid+String.fromCharCode(nforks+97);
						}
						else {
							var nforks = result2.stats.forks.length;
							if (nforks < 26){
								chartid = chartid+String.fromCharCode(nforks+97);
							}
							else if (nforks < 26*10*26){
								var secondchar = Math.floor(nforks/(26*26));
								var firstval = Math.floor((nforks-secondchar*26*26)/26);
								var firstchar = String.fromCharCode(firstval+97);
								var lastchar = String.fromCharCode((nforks%26)+97);
								chartid = chartid+ firstchar + secondchar + lastchar;
							}
						}
						var newchart = new Chart({id:chartid,data:result2.data,options:result2.options,users:{creator:username,view:['any'],fork:['any'],edit:{all:['private']}},modifiers:result2.modifiers,types:result2.types,stats:{time:Date.now(),views:{},forks:[]}});
						result2.stats.forks.push(String.fromCharCode(nforks+97));
						result2.markModified('stats');
						Promise.all([newchart.save(),result2.save()]).then(function(values) {
							console.log('saved both', values[1].stats.views);
							if (username != '') {
								User.updateOne({username: username, "charts.forked": { "$ne": chartid}}, {$push: {"charts.forked": chartid}}, function (err, result) {});
							}
							res.redirect('../edit/'+chartid);
						});
					}
					else if (result2.users.fork[0] == 'friends' && username != '') {
						User.countDocuments({username: username, followers: result2.users.creator}, function(err, result3) {
							if (err){res.redirect('../charts/'+chartid); return;}
							else if (result3 > 0){
								if (!result2.stats.forks){
									var nforks = 0;
									chartid = chartid+String.fromCharCode(nforks+97);
								}
								else {
									var nforks = result2.stats.forks.length;
									if (nforks < 26){
										chartid = chartid+String.fromCharCode(nforks+97);
									}
									else if (nforks < 26*10*26){
										var secondchar = Math.floor(nforks/(26*26));
										var firstval = Math.floor((nforks-secondchar*26*26)/26);
										var firstchar = String.fromCharCode(firstval+97);
										var lastchar = String.fromCharCode((nforks%26)+97);
										chartid = chartid+ firstchar + secondchar + lastchar;
									}
								}
								var newchart = new Chart({id:chartid,data:result2.data,options:result2.options,users:{creator:username,view:['any'],fork:['any'],edit:{all:['private']}},modifiers:result2.modifiers,types:result2.types,stats:{time:Date.now(),views:{},forks:[]}});
								result2.stats.forks.push(String.fromCharCode(nforks+97));
								result2.markModified('stats');
								Promise.all([newchart.save(),result2.save()]).then(function(values) {
									console.log('saved both', values[1].stats.views);
									if (username != '') {
										User.updateOne({username: username, "charts.forked": { "$ne": chartid}}, {$push: {"charts.forked": chartid}}, function (err, result) {});
									}
									res.redirect('../edit/'+chartid);
								});
							}
							else {
								console.log('No permission to fork this chart.')
								res.redirect('../charts/'+chartid);
							}
					
						})
					}
					else {
						console.log('No permission to fork this chart.')
						res.redirect('../charts/'+chartid);
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
						/*var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
						tempKeys[tkey] = {username:username};
						tempKeys[tkey].dataid = chartid;
						tempKeys[tkey].chartidtemp = chartid;
						res.write(nunjucks.render('chartdn.html',{
							chartScript: '', 
							dataAreaText: '',
							key: tkey,
						}));
						res.end();*/

				  } 
				  else { //Load chart data and options
					dataname = result.data;
					myOptions = result.options;
					
					if (result.options.nsteps || result.options.nsteps === 0){
						delete result.options.nsteps;
						result.markModified('options');
						result.save(function (err, result) {
							if (err) return console.error('sajdhfkasdhj\n',err);
							console.log('deleted nsteps');
						});
					}
					
					if (result.users.edit.all[0]== 'any' || result.users.creator == username) {
						if (username != '') {
							User.updateOne({username: username, "charts.edited": { "$ne": chartid}, "charts.forked": { "$ne": chartid}, "charts.created": { "$ne": chartid}}, {$push: {"charts.edited": chartid}}, function (err, result) {});
						}
						var savedData = myOptions;
						var chartType = {'line':'','bar':'','scatter':'','pie':'','bubble':'','histogram':'','heatmap':'','radar':'','box':'','choropleth':'','splom':'','diff':'','calendar':''};
						if (savedData['type'] && savedData['type'] != ''){
							chartType[savedData['type']]='selected="selected"';
						}
						var xaxis = {'scale':{}};
						if (savedData.labels && savedData.labels.x){xaxis.title = savedData.labels.x;}
						if (savedData.scale && savedData.scale.x){xaxis.scale[savedData.scale.x] = 'selected="selected"';}
						if (savedData.stepSize && savedData.stepSize.x){xaxis.stepSize = savedData.stepSize.x;}
						if (savedData.domain){xaxis.domain = savedData.domain;}
						var yaxis = {'scale':{},'dots':{},'shape':{},'dash':{}};
						if (savedData.labels && savedData.labels.y){yaxis.title = savedData.labels.y;}
						if (savedData.scale && savedData.scale.y){yaxis.scale[savedData.scale.y] = 'selected="selected"';}
						if (savedData.stepSize && savedData.stepSize.y){yaxis.stepSize = savedData.stepSize.y;}
						if (savedData.range){yaxis.range = savedData.range;}
						if (savedData.lineColors){yaxis.lineColors = savedData.lineColors;}
						if (savedData.dots){yaxis.dots[savedData.dots] = 'checked="checked"';}
						if (savedData.shape){yaxis.shape[savedData.shape] = 'checked="checked"';}
						if (savedData.dash){yaxis.dash[savedData.dash] = 'selected="selected"';}
						var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
						tempKeys[tkey] = {username:username,sendTable:'yes'};
						tempKeys[tkey].dataid = dataname.split('.')[0];
						tempKeys[tkey].chartid = chartid;
						var hasData = true;
						if (!dataname || dataname == ''){
							hasData = false;
						}
						res.write(nunjucks.render('chartdn.html',{
							chartScript: '',
							hasData: hasData,
							nHeaders: savedData.nHeaders || 1,
							isChecked: chartType,
							options: savedData || {},
							users: result.users || {},
							modifiers: result.modifiers || [],
							title: savedData.title || '',
							xaxis: xaxis,
							yaxis: yaxis,
							xColumn: savedData.xColumn || '',
							yColumns: savedData.yColumns || '',
							chartid: chartid || '',
							key: tkey,
							isCreator: result.users.creator == username,
						}));
						res.end();
					}
					else if (result.users.edit.all[0]== 'friends' && username != '') {
						User.countDocuments({username: username, followers: result.users.creator}, function(err, result3) {
							if (err){
								res.redirect('../charts/'+chartid);
								return;
							}
							else if (result3 > 0){
								if (username != '') {
									User.updateOne({username: username, "charts.edited": { "$ne": chartid}, "charts.forked": { "$ne": chartid}, "charts.created": { "$ne": chartid}}, {$push: {"charts.edited": chartid}}, function (err, result) {});
								}
								var savedData = myOptions;
								var chartType = {'line':'','bar':'','scatter':'','pie':'','bubble':'','histogram':'','heatmap':'','radar':'','box':'','choropleth':'','splom':'','diff':'','calendar':''};
								if (savedData['type'] && savedData['type'] != ''){
									chartType[savedData['type']]='selected="selected"';
								}
								var xaxis = {'scale':{}};
								if (savedData.labels && savedData.labels.x){xaxis.title = savedData.labels.x;}
								if (savedData.scale && savedData.scale.x){xaxis.scale[savedData.scale.x] = 'selected="selected"';}
								if (savedData.stepSize && savedData.stepSize.x){xaxis.stepSize = savedData.stepSize.x;}
								if (savedData.domain){xaxis.domain = savedData.domain;}
								var yaxis = {'scale':{},'dots':{},'shape':{},'dash':{}};
								if (savedData.labels && savedData.labels.y){yaxis.title = savedData.labels.y;}
								if (savedData.scale && savedData.scale.y){yaxis.scale[savedData.scale.y] = 'selected="selected"';}
								if (savedData.stepSize && savedData.stepSize.y){yaxis.stepSize = savedData.stepSize.y;}
								if (savedData.range){yaxis.range = savedData.range;}
								if (savedData.lineColors){yaxis.lineColors = savedData.lineColors;}
								if (savedData.dots){yaxis.dots[savedData.dots] = 'checked="checked"';}
								if (savedData.shape){yaxis.shape[savedData.shape] = 'checked="checked"';}
								if (savedData.dash){yaxis.dash[savedData.dash] = 'selected="selected"';}
								var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
								tempKeys[tkey] = {username:username,sendTable:'yes'};
								tempKeys[tkey].dataid = dataname.split('.')[0];
								tempKeys[tkey].chartid = chartid;
								var hasData = true;
								if (!dataname || dataname == ''){
									hasData = false;
								}
								res.write(nunjucks.render('chartdn.html',{
									chartScript: '',
									hasData: hasData,
									nHeaders: savedData.nHeaders || 1,
									isChecked: chartType,
									options: savedData || {},
									users: result.users || {},
									modifiers: result.modifiers || [],
									title: savedData.title || '',
									xaxis: xaxis,
									yaxis: yaxis,
									xColumn: savedData.xColumn || '',
									yColumns: savedData.yColumns || '',
									chartid: chartid || '',
									key: tkey,
									isCreator: result.users.creator == username,
								}));
								res.end();
							}
							else {
								console.log('No permission to fedit this chart.')
								res.redirect('../charts/'+chartid);
							}
					
						})
					}
					else {
					  	console.log(result.users.creator,username);
					  	res.redirect('../charts/'+chartid);
					}

				  }
				  
				});

		});
    }
);
const loginServer = https.createServer(options, loginApp);
loginServer.listen(3000);



function convertDataToFull(dataStr,nHeaders,modifiers,nsteps,types,cpptable) {

	rawArray = dataStr;
	var t1 = performance.now();
	console.log('tocopy cpptable',performance.now());
	cpptable.copyArray();
	console.log('copied cpptable',performance.now());
	/*if (cpptable){
		cpptable.sortArray();
	}
	console.log('sorted cpptable',performance.now());
	if (cpptable){
		cpptable.readRow(5,1);
	}
	console.log('output 1 row cpptable',performance.now());*/
	var t2;//gets used in modifiers
	var hArray = rawArray.slice(0,nHeaders);
	rawArray.splice(0,nHeaders);
	
	var idx = 0;
	var allHeaders = {};
	var modifiedArray = [];
	
	for (var i in modifiers){
		
		allHeaders[modifiers[i].id]=[];
		for (var ii in hArray[0]){
			allHeaders[modifiers[i].id].push(hArray[0][ii]);
		}
		if (!modifiers[i].enabled){continue;}
		if (nsteps === 0 || (nsteps && idx >= nsteps)){
			
			allHeaders['modified']={};
			allHeaders['modified'].headers=hArray[0].slice();
			allHeaders['modified'].types=types.slice();
			modifiedArray = [];
			//var rlen = rawArray.length;
			var rlen = Math.min(1000,rawArray.length);
			var newrow = cpptable.readRow(ii);
			if (newrow.length > 0){
				modifiedArray.push(newrow);
			}
			nsteps = false;
		}
		else {idx++;}
		t2 = performance.now();
		if (modifiers[i].type == 'new'){
			if (hArray.length>0){
				hArray[0].push(modifiers[i].name);
			}
			console.log('starting new col', performance.now());
			var bothparts = modJS.newpostfix(modifiers[i].options.formula);
			modifiers[i].options['intstr']=bothparts[0];
			modifiers[i].options['expstr']=bothparts[1];
			cpptable.newCol(modifiers[i].options);
			console.log('created new col', performance.now());
		}
		else if (modifiers[i].type == 'filter'){
			//modJS.filter(rawArray,modifiers[i].options,nHeaders);
			console.log('starting filter', performance.now());
			var bothparts = modJS.newpostfix(modifiers[i].options.formula);
			modifiers[i].options['intstr']=bothparts[0];
			modifiers[i].options['expstr']=bothparts[1];
			cpptable.filter(modifiers[i].options);
			console.log('finished filter', performance.now());
		}
		else if (modifiers[i].type == 'sort'){
			cpptable.sortArray(modifiers[i].options);
		}
		else if (modifiers[i].type == 'replace'){
			modJS.replace(rawArray,modifiers[i].options);
		}
		else if (modifiers[i].type == 'pivot'){
			modJS.pivot(rawArray,modifiers[i].options,hArray,types);
			cpptable.pivot(modifiers[i].options);
			//Update columns in create chart
		}
	}
	var t3 = performance.now();
	allHeaders['current']=[];
	for (var ii in hArray[0]){
		allHeaders['current'].push(hArray[0][ii]);
	}
	
	
	if (!modifiedArray || modifiedArray.length == 0){
		
		allHeaders['modified']={};
		allHeaders['modified'].headers=hArray[0].slice();
		allHeaders['modified'].types=types.slice();
		modifiedArray = [];
		//var rlen = rawArray.length;
		var rlen = Math.min(1000,rawArray.length-1);
		var t4 = performance.now();
		for (var ii=0;ii<rlen;ii++){
			//modifiedArray[ii] = rawArray[ii].slice();
			var newrow = cpptable.readRow(ii);
			if (newrow.length > 0){
				modifiedArray.push(newrow);
			}
			
		}
	}
	var t5 = performance.now();
	//console.log(filteredArray);
	retArray = [];
	var col1 = cpptable.readCol(1);
	
	var cols = [];
	var t6 = performance.now();
	console.log('modifier time',t1,t2,t3,t4,t5,t6);
	return {'modified':modifiedArray,'headers':allHeaders};
	
}
function makeChartsWithData(ws,rawdata,chartInfo,chartStyle,dm,reloadTable,cpptable) {
	var maxColumns = 50;
	var newData = [];
	var rawLen = rawdata.length;
	for (var i=0;i<rawLen;i++){
		newData.push(rawdata[i].slice(0,maxColumns));
	}
	console.log('data converted',performance.now());
	var nHeaders = chartInfo.options.nHeaders || 1;
	var data = convertDataToFull(newData,nHeaders,chartInfo.modifiers,chartInfo.options.nsteps,chartInfo.types.slice(0,maxColumns),cpptable);
	console.log('modifiers applied',performance.now());
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
	if (chartStyle == 'all' || chartStyle == 'plotly') {
		var chartJSON = createPlotly.createPlotly(data,chartInfo.options,cpptable);
		console.log('plotly created',performance.now());
		if (!dm.loc){dm.loc = 0}
		var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'plotly','allHeaders':data.headers};
		if (reloadTable){
			jsonmessage['mdata']=data.modified;
		}
		console.log('precompress: ',performance.now());
		var a = JSON.stringify(jsonmessage);
		if (a.length > 999999){
			console.log('stringified: ', a.length, "   ",performance.now());
			var b = pako.deflate(a, {to:'string'});
			console.log('compressed: ',performance.now());
			var c = btoa(b);
			console.log('stringed: ', c.length, "   ",performance.now());
			ws.send(c);
		}
		else {
			console.log('no compression: ',performance.now());
			ws.send(a);
		}
		console.log('message sent',performance.now());
	}
}

function makeAllCharts(ws,dm,chartInfo,chartStyle='all',chgTypes,sendTable,cpptable) {
	
	return new Promise(function(resolve, reject) {
		if (!chartInfo.data){reject('no data file');}
        fs.readFile('saved/'+chartInfo.data, 'utf8', function(err, fileData) {
        	console.log(chartInfo.data);
        	if (err){
        		reject(err);
        	}
			else if (!fileData || fileData.length == 0 ){
				reject('file empty');
			}
			else {
				
				console.log('file read',performance.now());
				var results = Papa.parse(fileData, {
					delimiter: dm.delimiter || chartInfo.options.delimiter || "",
					skipEmptyLines: false,
					quoteChar: '"',
				});
				var returnData = {};
				console.log('file parsed',performance.now());
				cpptable.clearArray();
				cpptable.loadRows(results.data);
				console.log('cpptable loaded',performance.now());
				cpptable.copyArray();
				console.log('cpptable copied',performance.now());
				if (chgTypes){
					console.log('start getting types',performance.now());
					var types = cpptable.makeTypes(results.data.slice(0,1000));
					console.log('got types',performance.now());
					returnData.types = types;
				}
				else {
					//console.log(chartInfo.types);
				}
				makeChartsWithData(ws,results.data,chartInfo,chartStyle,dm,sendTable,cpptable);
				returnData.data = results.data;
				resolve(returnData);
			}
		});
    });

	
}

