const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const User = new Schema({});
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);