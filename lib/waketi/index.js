var Message = require('../model/message.js');

var Log = require('log')
, fs = require('fs')
, stream = fs.createWriteStream(__dirname + '/../../waketi.log')
, log = new Log(Log.DEBUG, stream);

// 人工無脳インスタンスを返す、initメソッドを定義
exports.init = function() {

  var munode = {};
 
  /* プライベートメソッド */

  // waketi
  function waketi(msg, broadCastSender) {
	  var http = require('http');
	  var options = {
		  host: 'localhost',
		  port: 12345,
		  path: '/',
		  method: 'POST'
	  };
	  log.debug("request to waketi:" + msg);
	  var req = http.request(options, function(res) {
		  log.debug('STATUS: ' + res.statusCode);
		  log.debug('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
			  log.debug('BODY: ' + chunk);
			  var obj =  JSON.parse(chunk);
			  var m = obj['message'];
			  if (m != undefined) {
				name = 'わけち';
			  	broadCastSender(name, m);
				// save
				var message = new Message();
				message.message = m;
				message.name = name;
				log.debug("insert name:" + message.name + " message:" + message.message + " obj:" + message);
				message.save(
					function(err){
						if (err) {
							log.error('insert failed');
						} else {
							log.debug('insert OK');
						}
					}
					);
			  }
		  });
	  });
	  // write data to request body
	  req.write('q='+msg+'\n');
	  req.end();

	  req.on('error', function(e) {
		  log.debug('problem with request: ' + e.message);
	  });
  }

  /* パブリックメソッド */

  // msgに対して応答を返す。
  function talk(msg, func) {
    //return parrot(msg);
    return waketi(msg, func);
  }

  munode.talk = talk;
  
  return munode;
};

