
const https = require('https');
//const http = require('http');
var fs = require("fs");
//var myParser = require("body-parser");
var qs = require('querystring');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
var parse = require('csv-parse');
var nunjucks = require('nunjucks');
//const flate = require('wasm-flate');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};


const User = require('./models/user');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/chartdn', {useNewUrlParser: true});

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
		res.write(nunjucks.render('loginregister.html',{}));
		res.end();
  	}
  	else {
  		var charts = {created:[],edited:[],forked:[],viewed:[]};
  		charts.created = req.user.charts || [];
  		res.write(nunjucks.render('account.html',{
  			username: req.user.username,
  			name: req.user.name || '',
  			robot: req.user.robot || 1,
  			charts: req.user.charts || {},
  		}));
		res.end();
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
  		User.findOne({ username: req.user.username }, function(err, result) {
		  if (err) {
	
		  } else {
			result.name=req.body.name;
			result.robot=parseInt(req.body.robot);
			result.save(function (err, result) {
				if (err) return console.error('error updating user\n',err);
  				res.redirect('/account');
			});
		  }
		});
  		
  	}
  }
);

app2.post('/register',
  function(req, res){
  	var user = new User({username: req.body.username, charts: []});
	User.register(user,req.body.password, function(err) {
		if (err) {
		  console.log('error while user register!', err);
		  res.redirect('/account');
		}
		
		console.log('user registered!');
		var robot = 'python3 python/createrobo.py '+req.body.username;
		var child = exec(robot, function(err, stdout, stderr) {
			
			req.login(user, function(err) {
			  if (err) { res.redirect('/'); }
			  else {res.redirect('/account'); }
			});
		});
		
		

	});
  }
);

  
app2.post('/login', 
  passport.authenticate('local', { successRedirect: '/account', failureRedirect: '/fail' })
);



module.exports = app2;
