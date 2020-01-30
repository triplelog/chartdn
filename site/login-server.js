
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
  		res.write(nunjucks.render('account.html',{
  			username: req.user.username,
  		}));
		res.end();
  	}
  	
  }
);

app2.post('/register',
  function(req, res){
  	
	User.register(new User({username: req.body.username}),req.body.password, function(err) {
		if (err) {
		  console.log('error while user register!', err);
		  res.redirect('/account');
		}

		console.log('user registered!');

		res.redirect('/account');
	});
  }
);

  
app2.post('/login', 
  passport.authenticate('local', { failureRedirect: '/fail' }),
  function(req, res) {
    res.redirect('/account');
  }
);



module.exports = app2;
