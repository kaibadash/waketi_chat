var Message = require('../model/message.js');

// 人工無脳インスタンスを返す、initメソッドを定義
exports.init = function() {

  var munode = {};
 
  /* プライベートメソッド */

  // waketi
  function waketi(msg, broadCastSender) {
	  var http = require('http');
	  console.log("msg:" + msg + " func:" + broadCastSender);
	  var options = {
		  host: 'localhost',
		  port: 12345,
		  path: '/',
		  method: 'POST'
	  };
	  var req = http.request(options, function(res) {
		  console.log('STATUS: ' + res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
			  console.log('BODY: ' + chunk);
			  var obj =  JSON.parse(chunk);
			  var m = obj['message'];
			  if (m != undefined) {
				name = 'わけち';
			  	broadCastSender(name, m);
				// save
				var message = new Message();
				message.message = m;
				message.name = name;
				console.log("insert name:" + message.name + " message:" + message.message + " obj:" + message);
				message.save(
					function(err){
						if (err) {
							console.log('insert failed');
						} else {
							console.log('insert OK');
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
		  console.log('problem with request: ' + e.message);
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

