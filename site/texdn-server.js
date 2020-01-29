
const https = require('https');
//const http = require('http');
var fs = require("fs");
//var myParser = require("body-parser");
var qs = require('querystring');
const { exec } = require('child_process');
var parse = require('csv-parse');
var nunjucks = require('nunjucks');
//const flate = require('wasm-flate');
var createLine = require('./createCharts/line-charts.js');
var createBar = require('./createCharts/bar-charts.js');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};


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


app.use(passport.initialize());
app.use(passport.session());
app.get('/login',
  function(req, res){
    res.render('login');
  });
  
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
app.listen(1231);


const server1 = https.createServer(options, app);
//const server1 = http.createServer(options, app);

server1.listen(12312);


nunjucks.configure('templates', {
    autoescape: false
});

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
  var chartid = 'testchart';
  var jsonmessage = {'operation':'id','message':chartid};
  ws.send(JSON.stringify(jsonmessage));
  ws.on('message', function incoming(message) {
  	var dm = JSON.parse(message);
  	if (dm.operation == 'upload'){
  		//make the directory
  		fs.mkdirSync('saved/'+chartid, { recursive: true });
  		//write data.csv
  		fs.writeFile("saved/"+chartid+"/data.csv", dm.message, function (err) {
			updateChart();
		});
  		//write options.json
  		fs.readFile("saved/"+chartid+"/options.json", 'utf8', function(err, fileData) {
  			if (err){
  				var defaultOptions = {};
  				defaultOptions['nHeaders'] = 1;
  				defaultOptions['filters'] = [];
  				defaultOptions['type'] = '';
  				defaultOptions['yColumns'] = '';
  				defaultOptions['xColumn'] = '';
  				defaultOptions['stepSizeX'] = '';
  				defaultOptions['stepSizeY'] = '';
  				defaultOptions['title'] = '';
				fs.writeFile("saved/"+chartid+"/options.json", JSON.stringify(defaultOptions), function (err) {
			
				});
			}
		});
  		//fs.writeFile("saved/"+chartid+"/options.json", JSON.stringify({'nHeaders':0}), function (err) {
			
		//});
  	}
  	else if (dm.operation == 'download'){
		  var wget = 'wget -O file.csv "' + dm.message + '" && echo "done"';
		  // excute wget using child_process' exec function
		  var child = exec(wget, function(err, stdout, stderr) {
			if (err) throw err;
			else {
				fs.readFile('file.csv', 'utf8', function(err, fileData) {
					var jsonmessage = {'operation':'downloaded','message':fileData};
					ws.send(JSON.stringify(jsonmessage));
				});
			}
		  });


  	}
  	else if (dm.operation == 'options'){
  		//make the directory
  		fs.mkdirSync('saved/'+chartid, { recursive: true });
  		//write data.csv
  		//fs.writeFile("saved/"+chartid+"/data.csv", dm.message, function (err) {
			
		//});
  		//write options.json
  		
  		fs.readFile("saved/"+chartid+"/options.json", 'utf8', function(err, fileData) {
  			if (err){
  			
  			}
  			else {
  				var options = JSON.parse(fileData);
  				for(var k in dm){
					if (k != 'operation'){
						options[k] = dm[k];
					}
				}
  				fs.writeFile("saved/"+chartid+"/options.json", JSON.stringify(options), function (err) {
					updateChart();
				});
  			}
			
		});
  		
  	}
  	
  });
});


https.createServer(options, function(req, res) {
	if (req.url.substring(0,8) == "/chartdn"){
		var chartid = '';
		var data = '';
		
		var start = process.hrtime();
        req.on('data', function (chunk) {
            data += chunk;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (data.length > 1e6)
                req.connection.destroy();
        });

		// when we get data we want to store it in memory
		req.on('end', () => {
			//console.log(qs.parse(data).latexArea);
			if (data.length > 0){
				var templateType = qs.parse(data).chartType;
				var templateLoc = 'static/charts/'+templateType+'Chart.txt';
				fs.readFile(templateLoc, 'utf8', function(err, fileData) {
					fs.writeFile("texdnLatex/newtest2.tex", fileData, function (err) {
						fs.writeFile("texdnData/newdata.csv", qs.parse(data).dataCopy, function (err) {
							var runtime = process.hrtime(start) // we also check how much time has passed
							console.info('Execution time (hr): %ds %dms', runtime[0], runtime[1] / 1000000);
							//exec('latex -output-directory=texdnLatex texdnLatex/newtest2.tex && dvisvgm --output=static/%f-%p texdnLatex/newtest2.dvi --font-format=woff && python3 static/charts/pythonscript.py');
							exec('latex -output-directory=texdnLatex texdnLatex/newtest2.tex && dvisvgm --output=static/%f-%p texdnLatex/newtest2.dvi --font-format=woff');

						});
					});
				});

				res.write(nunjucks.render('chartdn.html',{
					chartScript:createChart(qs.parse(data),convertDataToFull(qs.parse(data).dataCopy,qs.parse(data).nHeaders),'line'), 
					dataAreaText: qs.parse(data).dataCopy,
				}));
				res.end();
			}
			else {
				if (req.url.length>8 && req.url.substring(8,11) == "?q=") {
					chartid = req.url.substring(11);
					fs.readFile('saved/'+chartid+'/options.json', 'utf8', function(err, optionData) {
						fs.readFile('saved/'+chartid+'/data.csv', 'utf8', function(err, fileData) {
							var defaultData = ''
							if (!err) {defaultData = fileData;}
							var savedData = JSON.parse(optionData);
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
							}));
							res.end();
						});
					});
				}
				else {
					res.write(nunjucks.render('chartdn.html',{
						chartScript:'', 
						dataAreaText: '',
					}));
					res.end();
				}
				
			}
			
		});
	
    }

    
}).listen(3000);



function convertDataToFull(dataStr,nHeaders) {
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
		else if (frameworks[i] == 'chartjs'){
			if (title != '' && title != 'notitle') {options['title'] = 'title: {display: true, text: "'+title+'"},';}
			if (stepSizeX != '' && stepSizeX != 'default') {options['stepSizeX'] = 'stepSize: '+stepSizeX+',' }
			if (stepSizeY != '' && stepSizeY != 'default') {options['stepSizeY'] = 'stepSize: '+stepSizeY+',' }
			if (lineColor != '' && lineColor != 'default') {options['lineColor'] = lineColor}
			if (dotColor != '' && dotColor != 'default') {options['dotColor'] = dotColor}
		
			fullJS += chartFile.createChartjs(csvdata,options);
		}
	}




	return fullJS;
}
