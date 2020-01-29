
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
app.use(passport.initialize());
app.use(passport.session());
app.get('/register',
  function(req, res){
  	const user = new User({username: 'user'});
	user.setPassword('password');
	user.save();
	console.log('new user?');
    res.write(nunjucks.render('templates/login.html',{}));
    //res.writeHead(200);
  	res.end();
  });
app.get('/login',
  function(req, res){
  	
    res.write(nunjucks.render('templates/login.html',{}));
    //res.writeHead(200);
  	res.end();
  });
  
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/fail' }),
  function(req, res) {
    res.redirect('/success');
  });

const server1 = https.createServer(options, app);
server1.listen(3000);