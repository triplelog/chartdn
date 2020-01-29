
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
var createLine = require('./createCharts/line-charts.js');
var createBar = require('./createCharts/bar-charts.js');
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/chartdn.com/fullchain.pem')
};


const User = require('./models/user');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});

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
app2.use(bodyParser.json());
app2.use(bodyParser.urlencoded({extended: false}));
app2.use(passport.initialize());
app2.use(passport.session());

app2.get('/register',
  function(req, res){
    res.write(nunjucks.render('register.html',{}));
  	res.end();
  }
);
app2.post('/register',
  function(req, res){
  	
	User.register(new User({username: req.body.username}),req.body.password, function(err) {
		if (err) {
		  console.log('error while user register!', err);
		  return next(err);
		}

		console.log('user registered!');

		res.redirect('/');
	});
    res.write(nunjucks.render('register.html',{}));
    //res.writeHead(200);
  	res.end();
  }
);
app2.get('/login',
  function(req, res){
  	
    res.write(nunjucks.render('login.html',{}));
    //res.writeHead(200);
  	res.end();
  });
  
app2.post('/login', 
  passport.authenticate('local', { failureRedirect: '/fail' }),
  function(req, res) {
  	passport.serializeUser(function(user, done) {
		done(null, user.id); 
	   // where is this user.id going? Are we supposed to access this anywhere?
	});
  	console.log(req.user.username);
    res.redirect('/');
  }
);
app2.get('/success',
  passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
		done(err, user);
		res.redirect('/');
	  });
  });
);

const server2 = https.createServer(options, app2);
module.exports = server2;
