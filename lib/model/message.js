// message model
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/message',
		function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log('connection success!');
			}
		}
		);
var Schema = mongoose.Schema;

var MessageSchema  = new Schema({
	name: String,
	message: String,
	created_at: Date
});
MessageSchema.pre('save', function(next) {
	console.log("pre save");
	if (this.isNew) {
		this.created_at = new Date();
	}
	next();
});
// define model
mongoose.model('Message', MessageSchema);
module.exports = db.model('Message');
// db.disconnect();

