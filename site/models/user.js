const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const User = new Schema({name: String, robot: Number, charts: {created:Array,forked:Array,edited:Array,viewed:Array}, options: {}});
User.plugin(passportLocalMongoose);
module.exports = mongoose.model('User', User);