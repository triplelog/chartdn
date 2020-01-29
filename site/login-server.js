
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
const session = require("express-session");
app2.use(session({ secret: "cats" }));
app2.use(express.urlencoded({ extended: true }));
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
    res.redirect('/new');
  }
);
app2.get('/success',
  function(req, res) {
  	console.log(req.isAuthenticated());
  	console.log(req.user);
    res.redirect('/');
  }
);

const server2 = https.createServer(options, app2);
module.exports = server2;
