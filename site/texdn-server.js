var fromLogin = require('./login-server.js');
var loginApp = fromLogin.loginApp;
var tempKeys = fromLogin.tempKeys;

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
const pako = require('pako');
const atob = require('atob');
var toUint8Array = require('base64-to-uint8array')
var createPlotly = require('./createCharts/plotly-charts.js');
var createXkcd = require('./createCharts/xkcd-charts.js');
var createGoogle = require('./createCharts/google-charts.js');
var createChartjs = require('./createCharts/chartjs-charts.js');
var modJS = require('./modify.js');
var datatypes = require('./datatypes.js');
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
	id: {type: String, required: true, unique: true},
	data: String,
	options: {},
	modifiers: [],
	users: {creator:String,view:[String],fork:[String],edit:{'all':[String],'data':[String],'modify':[String],'chart':[String]}},
	types: Array,
	stats: {time:Date,views:{},forks:Array},
	
});
var Chart = mongoose.model('Chart', chartSchema);


const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8080);

const WebSocket = require('ws');
//const wss = new WebSocket.Server({ port: 8080 , origin: 'http://tabdn.com'});
const wss = new WebSocket.Server({ server });


function updateData(oldDataStr,delimiter,chartid,ws,dm,chartData){
	var results = Papa.parse(oldDataStr, {
		delimiter: delimiter,
	});
	var nHeaders = 1;
	var newColumns = [];
	var deleteColumns = [];
	var chgRows = [];
	for (var i=0;i<dm.message.length;i++){
		if (dm.message[i].col){
			var cellData = dm.message[i];
			results.data[cellData.row+nHeaders][parseInt(cellData.col.substring(3))] = cellData.value;
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
			results.data.push([]);
			originalRows[chgRows[i].originalRow] = {'row':[],'index':chgRows[i].originalRow+nHeaders};
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
	results.data.forEach(function(v) { 
		if (newColumns.length == 0){
			file.write(v.join(', ') + '\n'); 
		}
		else {
			var newLine = '';
			var i=0;
			for (i=0;i<newColumns.length-1;i++){
				newLine += v[newColumns[i]]+', ';
			}
			newLine += v[newColumns[i]]+'\n';
			file.write(newLine);
		}
	});
	file.end();
	loadChart(chartid,ws,dm,chartData,false,false);
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
wss.on('connection', function connection(ws) {
  var charts = {};
  var chartid = '';
  var dataid = '';
  var chartidtemp = '';
  var username = '';
  var myOptions = {};
  var chartData = false;
  var mongoChart = {};
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
			fstr = atob(pakores);
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
						loadChart(chartid,ws,dm,chartData,true,false);
						
					}
					
				});
			});
		}
		else {
			fs.writeFile("saved/"+chartid+".csv", fstr, function (err) {
				loadChart(chartid,ws,dm,chartData,false,false);

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
				loadChart(chartid,ws,dm,chartData,false,false);
				//fs.readFile('saved/'+chartid+'.csv', 'utf8', function(err, fileData) {
					//var jsonmessage = {'operation':'downloaded','message':fileData};
					//ws.send(JSON.stringify(jsonmessage));
					//loadChart(chartid,ws,dm,chartData,false,false);
				//});
			}
		});

		delete mongoChart[chartid];
		chartData = false;
  	}
  	else if (dm.operation == 'dataupdate'){

  		if (chartid != dataid){
  			Chart.updateOne({ id: chartid }, {data: chartid+'.csv'}, function(err, result) {});
		}
		fs.readFile('saved/'+dataid+'.csv', 'utf8', function(err, fileData) {
			updateData(fileData,'',chartid,ws,dm,chartData);
			dataid = chartid;
		});
		delete mongoChart[chartid];
		chartData = false;
  	}
  	else if (dm.operation == 'options'){
  		console.log('message rec',performance.now());
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
					makeAllCharts(ws,dm,result,'all').then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					if (dm.nsteps || dm.nsteps === 0){
						makeChartsWithData(ws,chartData,result,'all',dm,true);
					}
					else {
						makeChartsWithData(ws,chartData,result,'all',dm,false);
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
					makeAllCharts(ws,dm,result,'all').then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					if (dm.nsteps || dm.nsteps === 0){
						makeChartsWithData(ws,chartData,result,'all',dm,true);
					}
					else {
						makeChartsWithData(ws,chartData,result,'all',dm,false);
					}
					
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
					makeAllCharts(ws,dm,result,'all').then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					makeChartsWithData(ws,chartData,result,'all',dm,true);
					
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
					makeAllCharts(ws,dm,result,'all').then(function(result3) {
						chartData = result3.data;
					}, function(err) {
						console.log(err);
					});
					
				}
				else {
					console.log('used cached data', performance.now());
					makeChartsWithData(ws,chartData,result,'all',dm,true);
					
				}
			  }
			});
  		}
  		
  		
  		
  	}
  	else if (dm.operation == 'key'){
  		  console.log(dm.message);
  		  console.log(tempKeys[dm.message]);
		  username = tempKeys[dm.message].username;
		  console.log(username,tempKeys[dm.message]);
		  dataid = tempKeys[dm.message].dataid;
		  if (dm.chartid != ""){
		  	chartid = dm.chartid;
		  }
		  else {
		  	chartidtemp = tempKeys[dm.message].chartidtemp;
		  }
		  
  	}
  	else if (dm.operation == 'friend'){
		  var friend = dm.message;
		  var me = tempKeys[dm.tkey].username;
		  User.countDocuments({username: friend}, function(err, result) {
		  	if (err){return}
		  	else if (result > 0){
		  		User.updateOne({username: me, friends: { "$ne": friend}}, {$push: {friends: friend}}, function (err, result) {
		  			if (err){return}
		  			var jsonmessage = {'operation':'friend','message':friend};
					ws.send(JSON.stringify(jsonmessage));
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
			  	else if (!result.users.view || result.users.creator == username){
			  		if (result.data != ''){
						if (dm.style){
							makeAllCharts(ws,dm,result,dm.style);
						}
						else {
							makeAllCharts(ws,dm,result,'all');
						}
					}
			  	}
			  	else if (result.users.view[0] == 'friends'){
			  		//Check if result.users.creator is a friend
			  		if (result.data != ''){
						if (dm.style){
							makeAllCharts(ws,dm,result,dm.style);
						}
						else {
							makeAllCharts(ws,dm,result,'all');
						}
					}
			  	}
				
			  });
		  }
  	}
  	else if (dm.operation == 'search'){
		  var username = tempKeys[dm.tkey].username;
		  console.log(dm.key);
		  console.log(dm.tags);
  	}

  		

  });
});

function loadChart(chartid,ws,dm,chartData,deletexls=false,result=false){
	if (result){
		makeAllCharts(ws,dm,result,'all',true).then(function(result3) {
			chartData = result3.data;
			result.types = result3.types;
			result.markModified('types');
			result.save(function (err, chart) {
				if (err) return console.error(err);
				console.log('saved',chart.types.slice(0,10));
			});
		}, function(err) {
			console.log(err);
		});
	}
	else {
		Chart.findOne({ id: chartid }, function(err, result2) {
		  if (err) {
		
		  } else {
			makeAllCharts(ws,dm,result2,'all',true).then(function(result3) {
				chartData = result3.data;
				result2.types = result3.types;
				result2.markModified('types');
				result2.save(function (err, chart) {
					if (err) return console.error(err);
					console.log('saved types',chart.types.slice(0,10));
				});
			}, function(err) {
				console.log(err);
			});
			if (deletexls){
				fs.unlink("saved/"+chartid+"."+dm.type, (err) => {
					if (err){
						console.log('Did not delete xls file');
					}
				});
			}
		  }
		});
	}
	

}

loginApp.get('/browse',
	function(req, res){
		console.log(req.query);
		var charts = [];
		console.log('start looking: ', performance.now());
		var query = {'users.view': false};
		if (req.query.tags && req.query.creators) {
			var tags = req.query.tags.split(',');
			var creators = req.query.creators.split(',');
			query = { 'users.view': false, "options.tags": { $all: tags }, "users.creator": { $in: creators } };
		}
		else if (req.query.tags) {
			var tags = req.query.tags.split(',');
			query = { 'users.view': false, "options.tags": { $all: tags }};
		}
		else if (req.query.creators) {
			var creators = req.query.creators.split(',');
			query = { 'users.view': false, "users.creator": { $in: creators } };
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
			res.write(nunjucks.render('browse.html',{
				charts: charts,
				query: query,
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
		
		var chart = new Chart({id:chartid,data:'',options:defaultOptions,users:{creator:username,edit:{all:['private']}},modfiers:[],types:[],stats:{time:Date.now(),views:{},forks:[]}});
		chart.save(function (err, chart) {
			if (err) {
				console.log(err);
				chartid = parseInt(crypto.randomBytes(50).toString('hex'),16).toString(36).substr(2, 8);
				var chart2 = new Chart({id:chartid,data:'',options:defaultOptions,users:{creator:username,edit:{all:['private']}},modfiers:[],types:[],stats:{time:Date.now(),views:{},forks:[]}});
				chart2.save(function (err, chart2) {
					if (err) {
						console.log('second error', err);
				
					};
					console.log('new chart created');
					res.redirect('/edit/'+chartid);
				});	
				
			};
			if (req.user) {
				username = req.user.username;
				User.updateOne({username: username, "charts.created": { "$ne": chartid}}, {$push: {"charts.created": chartid}}, function (err, result) {});
			}
			console.log('new chart created');
			res.redirect('/edit/'+chartid);
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
			User.updateOne({username: username, "charts.viewed": { "$ne": chartid}}, {$push: {"charts.viewed": chartid}}, function (err, result) {});

		}
		Chart.updateOne({id: chartid},{$inc: {'stats.views.total':1}}, function(err, result) {});
		var start = process.hrtime();
		var title = 'ChartDN Chart';
        res.write(nunjucks.render('onechart.html',{
			username: username || '',
			chartid: chartid,
			title: title,
		}));
		res.end();
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
					if (!result2.users.fork || result2.users.creator == username) {
						if (!result2.stats.forks){
							var nforks = 0;
							chartid = chartid+String.fromCharCode(nforks+97);
						}
						else {
							var nforks = result2.stats.forks.length;
							chartid = chartid+String.fromCharCode(nforks+97);
						}
						var newchart = new Chart({id:chartid,data:result2.data,options:result2.options,users:{creator:username,edit:{all:['private']}},modifiers:result2.modifiers,types:result2.types,stats:{time:Date.now(),views:{},forks:[]}});
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
					else if (result2.users.fork == 'friends') {
						//Check if creator in friends
						if (!result2.stats.forks){
							var nforks = 0;
							chartid = chartid+String.fromCharCode(nforks+97);
						}
						else {
							var nforks = result2.stats.forks.length;
							chartid = chartid+String.fromCharCode(nforks+97);
						}
						var newchart = new Chart({id:chartid,data:result2.data,options:result2.options,users:{creator:username,edit:{all:['private']}},modifiers:result2.modifiers,types:result2.types,stats:{time:Date.now(),views:{},forks:[]}});
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
						fs.readFile('saved/'+dataname, 'utf8', function(err, fileData) {
							if (err){
								
							}
							var defaultData = '';
							if (!err) {defaultData = fileData;}
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
							tempKeys[tkey] = {username:username};
							tempKeys[tkey].dataid = dataname.split('.')[0];
							tempKeys[tkey].chartid = chartid;
							res.write(nunjucks.render('chartdn.html',{
								chartScript: '',
								dataAreaText: defaultData,
								nHeaders: savedData.nHeaders || 1,
								isChecked: chartType,
								options: savedData || {},
								modifiers: result.modifiers || [],
								title: savedData.title || '',
								xaxis: xaxis,
								yaxis: yaxis,
								xColumn: savedData.xColumn || '',
								yColumns: savedData.yColumns || '',
								chartid: chartid || '',
								key: tkey,
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



function convertDataToFull(dataStr,nHeaders,modifiers,nsteps,types) {

	rawArray = dataStr;
	var t1 = performance.now();

	
	var t2 = performance.now();
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
			modifiedArray = [];
			allHeaders['modified']={};
			allHeaders['modified'].headers=hArray[0].slice();
			allHeaders['modified'].types=types.slice();
			//var hlen = hArray.length;
			var rlen = rawArray.length;
			/*for (var ii=0;ii<hlen;ii++){
				allHeaders['modified'][ii] = hArray[ii].slice();
			}*/
			for (var ii=0;ii<rlen;ii++){
				modifiedArray[ii] = rawArray[ii].slice();
			}
			nsteps = false;
		}
		else {idx++;}
		
		if (modifiers[i].type == 'new'){
			modJS.newColumn(rawArray,modifiers[i].options,nHeaders,types);
			if (hArray.length>0){
				hArray[0].push(modifiers[i].name);
			}
			//Update columns in create chart
		}
		else if (modifiers[i].type == 'filter'){
			modJS.filter(rawArray,modifiers[i].options,nHeaders);
		}
		else if (modifiers[i].type == 'sort'){
			modJS.sort(rawArray,modifiers[i].options);
		}
		else if (modifiers[i].type == 'replace'){
			modJS.replace(rawArray,modifiers[i].options);
		}
		else if (modifiers[i].type == 'pivot'){
			modJS.pivot(rawArray,modifiers[i].options,hArray,types);
			//Update columns in create chart
		}
	}
	allHeaders['current']=[];
	for (var ii in hArray[0]){
		allHeaders['current'].push(hArray[0][ii]);
	}

	var filteredArray = hArray.concat(modJS.toData(rawArray));
	if (!modifiedArray || modifiedArray.length == 0){
		modifiedArray = [];
		allHeaders['modified']={};
		allHeaders['modified'].headers=hArray[0].slice();
		allHeaders['modified'].types=types.slice();
		//var hlen = hArray.length;
		var rlen = rawArray.length;
		/*for (var ii=0;ii<hlen;ii++){
			modifiedArray[ii] = hArray[ii].slice();
		}*/
		for (var ii=0;ii<rlen;ii++){
			modifiedArray[ii] = rawArray[ii].slice();
		}
	}
	var t6 = performance.now();
	console.log(t2,t6);
	//console.log(filteredArray);
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
	return {'byrow':retArray,'bycol':cols,'modified':modifiedArray,'headers':allHeaders};
	
}
function makeChartsWithData(ws,rawdata,chartInfo,chartStyle,dm,reloadTable=true) {
	var maxColumns = 50;
	var newData = [];
	var rawLen = rawdata.length;
	for (var i=0;i<rawLen;i++){
		newData.push(rawdata[i].slice(0,maxColumns));
	}
	console.log('data converted',performance.now());
	var nHeaders = chartInfo.options.nHeaders || 1;
	var data = convertDataToFull(newData,nHeaders,chartInfo.modifiers,chartInfo.options.nsteps,chartInfo.types.slice(0,maxColumns));
	
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
		var chartJSON = createPlotly.createPlotly(data,chartInfo.options);
		console.log('plotly created',performance.now());
		if (!dm.loc){dm.loc = 0}
		var jsonmessage = {'operation':'chart','message':chartJSON,'loc':dm.loc,'style':'plotly','allHeaders':data.headers};
		if (reloadTable){
			jsonmessage['mdata']=data.modified;
		}
		ws.send(JSON.stringify(jsonmessage));
		console.log('message sent',performance.now());
	}
}

function makeAllCharts(ws,dm,chartInfo,chartStyle='all',chgTypes=false) {
	return new Promise(function(resolve, reject) {
        fs.readFile('saved/'+chartInfo.data, 'utf8', function(err, fileData) {
        	if (err){reject(err);}
			if (!fileData || fileData.length == 0 ){reject('nofile');}
			console.log('file read',performance.now());
			var results = Papa.parse(fileData, {
				delimiter: chartInfo.options.delimiter || ""
			});
			var returnData = {};
			if (chgTypes){
				var types = datatypes.makeTypes(results.data.slice(0,1000));
				returnData.types = types;
			}
			else {
				//console.log(chartInfo.types);
			}
			console.log('parsed',performance.now());
			makeChartsWithData(ws,results.data,chartInfo,chartStyle,dm);
			returnData.data = results.data;
			resolve(returnData);
		});
    });

	
}

