const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const User = new Schema({name: String, charts: {created:Array,forked:Array,edited:Array,viewed:Array}, friends: [], followers: [], options: {}});
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);