
const https = require('https');
//const http = require('http');
var fs = require("fs");
//var myParser = require("body-parser");
var qs = require('querystring');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
var parse = require('csv-parse');
var nunjucks = require('nunjucks');
var crypto = require("crypto");
//const flate = require('wasm-flate');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};
const { PerformanceObserver, performance } = require('perf_hooks');

var tempKeys = {};
const User = require('./models/user');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/chartdn', {useNewUrlParser: true});
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

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
// use static authenticate method of model in LocalStrategy
//passport.use(User.createStrategy());
 
// use static serialize and deserialize of model for passport session support
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var express = require('express');



var app2 = express();
const session = require("express-session");
app2.use(session({ secret: "cats" }));
app2.use(express.urlencoded({ extended: true }));
app2.use(bodyParser.json());
app2.use(bodyParser.urlencoded({extended: false}));
app2.use(passport.initialize());
app2.use(passport.session());

app2.get('/account',
  function(req, res){
  	if (!req.isAuthenticated()){
  		if (req.query.e && req.query.e=='duplicate'){
  			res.write(nunjucks.render('loginregister.html',{
				duplicate: true,
			}));
			res.end();
  		}
  		else if (req.query.e && req.query.e=='badlogin'){
  			res.write(nunjucks.render('loginregister.html',{
				badlogin: true,
			}));
			res.end();
  		}
  		else {
  			res.write(nunjucks.render('loginregister.html',{}));
			res.end();
  		}
		
  	}
  	else {
  		var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
		tempKeys[tkey] = {username:req.user.username};
  		var charts = {created:[],edited:[],forked:[],viewed:[]};
  		console.log('len of viewed: ',req.user.charts.viewed.length);
  		if (req.user.charts.viewed.length > 5999){
  			req.user.charts.viewed.splice(0,1000);
  			User.updateOne({username:req.user.username},{'charts.viewed': req.user.charts.viewed}, function(err,result){});
  		}
  		charts.created = req.user.charts.created || [];
  		charts.forked = req.user.charts.forked || [];
  		charts.edited = req.user.charts.edited || [];
  		charts.viewed = req.user.charts.viewed || [];
  		var chartkeys = ['created','forked','edited','viewed'];
  		var startTab = 'charts';
  		if (req.query.t){
  			startTab = req.query.t;
  		}
  		res.write(nunjucks.render('account.html',{
  			username: req.user.options.displayName || req.user.username,
  			name: req.user.name || '',
  			robot: req.user.options.robot || 1,
  			charts: charts || {},
  			chartkeys: chartkeys || [],
  			friends: req.user.friends,
  			tkey: tkey,
  			startTab: startTab,
  		}));
		res.end();
  	}
  	
  }
);
app2.get('/user/:username',
  function(req, res){
  	if (!req.isAuthenticated() || req.user.username != req.params.username){
  		console.log(req.params.username);
  		User.findOne({username: req.params.username}, function(err,result){
  			if (err){return;}
  			console.log(result)
  			var tkey = crypto.randomBytes(100).toString('hex').substr(2, 18);
  			var username = '';
  			var addFriend = false;
  			if (req.isAuthenticated()){
  				username = req.user.username;
  				addFriend = true;
  				var myFriends = req.user.friends;
  				var nFriends = myFriends.length;
  				for (var i=0;i<nFriends;i++){
  					if (myFriends[i] == result.username){
  						addFriend = false;
  						break;
  					}
  				}
  			}
			tempKeys[tkey] = {username:username};
  			var charts = {created:[],edited:[],forked:[],viewed:[]};
  			Promise.all([Chart.find({id: {$in: result.charts.created}, 'users.view': 'any'}, 'id'),Chart.find({id: {$in: result.charts.edited}, 'users.view': 'any'}, 'id'),Chart.find({id: {$in: result.charts.forked}, 'users.view': 'any'}, 'id'),Chart.find({id: {$in: result.charts.viewed}, 'users.view': 'any'}, 'id')]).then(function(results) {
  				for (var i=0;i<results[0].length;i++){
  					charts.created.push(results[0][i].id);
  				}
  				for (var i=0;i<results[1].length;i++){
  					charts.edited.push(results[1][i].id);
  				}
  				for (var i=0;i<results[2].length;i++){
  					charts.forked.push(results[2][i].id);
  				}
  				for (var i=0;i<results[3].length;i++){
  					charts.viewed.push(results[3][i].id);
  				}
				var chartkeys = ['created','forked','edited','viewed'];
				res.write(nunjucks.render('account.html',{
					username: result.options.displayName || result.username,
					name: result.name || '',
					robot: result.options.robot || 1,
					charts: charts || {},
					chartkeys: chartkeys || [],
					friends: [],
					privacy: true,
					addfriend: addFriend,
					tkey: tkey,
				}));
				res.end();
  			})
			
  		
  		})
		
  	}
  	else {
  		res.redirect('/account');
  	}
  	
  }
);
app2.post('/settings',
  function(req, res){
  	if (!req.isAuthenticated()){
		res.redirect('/account');
  	}
  	else {
  		var user = req.user;
  		var query = {};
  		if (user.name != req.body.name){
  			query['name']= req.body.name;
  		}
  		if (user.options.robot != parseInt(req.body.robot)){
  			query['options.robot']= parseInt(req.body.robot);
  			if (!fs.existsSync('static/robots/'+user.username+req.body.robot+'.png')){
				var robot = 'python3 python/robohash/createrobo.py '+user.username+' '+req.body.robot;
				var child = exec(robot, function(err, stdout, stderr) {
					User.updateOne({ username: req.user.username }, query, function(err, result) {
						res.redirect('/account?t=settings');
					});
				});
			}
			else {
				User.updateOne({ username: req.user.username }, query, function(err, result) {
					res.redirect('/account?t=settings');
				});
			}
  		}
  		else if (query){
  			User.updateOne({ username: req.user.username }, query, function(err, result) {
				res.redirect('/account?t=settings');
			});
  		}
  		else {
  			res.redirect('/account?t=settings');
  		}
  		
  	}
  }
);

app2.post('/register',
  function(req, res){
  	console.log('registering: ',performance.now());
  	var user = new User({username: req.body.username.toLowerCase(), charts: {created:[],forked:[],edited:[],viewed:[]}, friends:[], followers:[], options: {displayName: req.body.username,favorites:{},robot:1}});
	User.register(user,req.body.password, function(err) {
		if (err) {
		  if (err.name == 'UserExistsError'){
		  	res.redirect('../account?e=duplicate');
		  }
		  else {
		  	console.log(err);
		  }
		  
		}
		else {
		
			console.log('user registered!',performance.now());
			var robot = 'python3 python/robohash/createrobo.py '+req.body.username.toLowerCase()+' 1';
			var child = exec(robot, function(err, stdout, stderr) {
				console.log('robot created: ',performance.now());
				req.login(user, function(err) {
				  if (err) { res.redirect('/'); }
				  else {
				  	console.log('logged in: ',performance.now());
				  	res.redirect('../account');
				  }
				});
			});
			
			
			
		}
		

	});
  }
);

function usernameToLowerCase(req, res, next){
	req.body.username = req.body.username.toLowerCase();
	next();
} 
app2.post('/login',  usernameToLowerCase,
	passport.authenticate('local', { successRedirect: '/account', failureRedirect: '/account?e=badlogin' })
);

app2.get('/logout', 
	function(req, res) {
	  req.logout();
	  res.redirect('../');
	}
);




module.exports = {loginApp: app2, tempKeys: tempKeys, Chart: Chart}
