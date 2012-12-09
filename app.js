
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , munode = require('./lib/waketi').init(),
  sio = require('socket.io');
var Log = require('log')
  , fs = require('fs')
  , stream = fs.createWriteStream(__dirname + '/waketi.log')
  , log = new Log(Log.DEBUG, stream);

var app = module.exports = express.createServer();
var Message = require('./lib/model/message.js');
var replyChance = 50;

log.info("----- start -----");

/**
 * 返信の必要有無を返す.
 */
function checkNeedReplyFromWaketi(str) {
	var res = (0 <= str.indexOf("waketi") || 
			0 <= str.indexOf("わけち") ||
			0 <= str.indexOf("w") ||
			0 <= str.indexOf("ｗ") ||
			0 <= str.indexOf("こん") || // こんにちは、こんばんは、こんちゃ
			0 <= str.indexOf("おは") || 
			0 <= str.indexOf("?") ||
			0 <= str.indexOf("？") ||
			0 <= str.indexOf("元気") ||
			0 <= str.indexOf("ラーメン") ||
			0 <= str.indexOf("食") ||
			0 <= str.indexOf("！") ||
			0 <= str.indexOf("!") ||
			0 <= str.indexOf("ランチ") 
	       );
	log.debug("checkNeedReplyFromWaketi:" + str + " res:" + res);
	return res;
}

function getDateStr(date){
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var date = date.getDate();
	if (month < 10) {
		month = "0" + month;
	}
	if (date < 10) {
		date = "0" + date;
	}
	return year + "/" + month + "/" + date;
}

// 超簡易srand
function srand(seed) {
	return seed * 123456789 + 12345;
}

/**
 * 文字列からHTMLカラーコードを返す
 */
function getColorCode(str) {
	if (str == undefined) {
		return "#000000";
	}
	var val = 0;
	for (var i = 0; i < str.length; i++) {
		val += str.charCodeAt(i);
	}
	var max = 192 * 3;
	var rStr = (srand(val) % 0xff).toString(16);
	rStr = (rStr.length == 1 ? "0" + rStr : rStr);
	val += 1;
	var gStr = (srand(val) % 0xff).toString(16);
	gStr = (gStr.length == 1 ? "0" + gStr : gStr);
	val += 1;
	var bStr = (srand(val) % 0xff).toString(16);
	bStr = (bStr.length == 1 ? "0" + bStr : bStr);
	val += 1;
	var colorCode = "#" + rStr + gStr + bStr;
	log.debug("colorCode:" + colorCode);
	return colorCode;
}

function validateName(str) {
	var validStr = str.replace(/^\s*(.*?)\s*$/, "$1"); //strip
	if (validStr == "わけち") {
		validStr = str.replace("わけち", "ブリュッセル");
	}
	log.debug("validateName:" + validStr);
	return validStr;
}


// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes

log.info("start listen");
var io = sio.listen(app);
var broadCastSender = function(name, input) {
	var reply = {
		name: name,
		input: input,
		colorCode: getColorCode(name)
	};
	log.info(name + " : " + input);
	if (name.lentgh > 10 || input.length > 140) {
		return;
	}
	io.sockets.emit('message', reply);
}

io.sockets.on('connection', function(socket) {
	log.debug('socket. connected');
	var queueSize = 2;
	var queueIndex = 0;
	var messageQueue = new Array(queueSize);

	socket.on('message', function(msg){
		//console.log('socket.on msg.name:' + msg.name + " msg.input:" + msg.input);
		msg.name = validateName(msg.name);
		broadCastSender(msg.name, msg.input);
		var message = new Message();
		message.message = msg.input;
		message.name = msg.name;
		messageQueue[queueIndex % queueSize] = message.message;
		queueIndex++;
		log.debug("insert name:" + message.name + " message:" + message.message + " obj:" + message);
		message.save(
			function(err){
				if (err) {
					log.error('insert failed:' + message.message);
				} else {
					log.debug('insert OK');
				}
			}
		);
		var rnd = Math.random() * 100;
		log.debug("insert end. check need reply from waketi:" + rnd);
		// if (rnd * 100 <= replyChance || checkNeedReplyFromWaketi(message.message)) {
		{
			var replyTarget = "";
			for (var i = 0; i < queueSize; i++) {
				replyTarget += messageQueue[i] + "。";
			}
			log.info("start request to waketi:" + replyTarget);
			munode.talk(replyTarget,broadCastSender);
		}
	});
});

app.get('/', function(req, res) {
	log.debug("get root");
	// Model.find(conditions, [fields], [options], [callback])
	// Message.find({}, ['name', 'message'], {sort:{'created_at':-1}, limit:300}, function(err, msgs) {
	msgs = Message.find().sort({created_at:-1}).limit(150).exec(function(err, msgs) {

		// 文字色を追加する(ユーザテーブルを作ってそこに持たせるべきだが…
		var colorCodeHash = new Array();
		for (var i = 0; i < msgs.length; i++) {
			var msg = msgs[i];
			log.debug("msg check:" + msg.name);
			if (colorCodeHash[msg.name] == undefined) {
				colorCodeHash[msg.name] = getColorCode(msg.name);
			}		
			msg["colorCode"] = colorCodeHash[msg.name];
			msg["created_at"] = getDateStr(new Date(msg["created_at"]));
		}


		console.log("find res:" + msgs);
		res.render('index', {title: 'waketi chat', messages:msgs});	
	});
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

console.log("start waketi_chat @ node");

