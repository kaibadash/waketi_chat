var server = '/';
var messageBak = "";
function submitName() {
    var name = $("#name_edit").val();
    console.log("submitName:" + name);
    $.cookie('name', name);
    if (0 < name.length) {
        console.log('hide modal');
        console.log('cookie:' + $.cookie('name'));
        $("#myModal").modal('hide');
    }
}

function escape(string) {
	return string
	.replace(/&/g, '&amp;')
	.replace(/"/g,  '&quot;')
	.replace(/'/g,  '&#039;')
	.replace(/</g,  '&lt;')
	.replace(/>/g,  '&gt;');
}

function showAlart(msg) {
	$("#myAlart").bind("show", function() {
		$("#myModal a.btn").click(function(e) {
			console.log("button pressed: "+$(this).html());

			$("#myAlart").modal('hide');
		});
	});
	$("#myAlart modal-body").text(msg);

	$("#myAlart").bind("hide", function() {
		$("#myAlart a.btn").unbind();
	});

	$("#myModal").modal({
		"backdrop"  : "static",
		"keyboard"  : true,
		"show"      : true
	});
}

function logout() {
	$.cookie('name', undefined);
	showAlart("ログアウトしました");
}

$(document).ready(function () {
    if ($.cookie('name') == undefined) {
        // wire up the buttons to dismiss the modal when shown
        $("#myModal").bind("show", function () {
//            $("#myModal a.btn").click(function(e) {
//                // do something based on which button was clicked
//                // we just log the contents of the link element for demo purposes
//                console.log("button pressed: "+$(this).html());
//
//                // hide the dialog box
//                $("#myModal").modal('hide');
//            });
        });

        // remove the event listeners when the dialog is hidden
        $("#myModal").bind("hide", function () {
            // remove event listeners on the buttons
            $("#myModal a.btn").unbind();
        });

        // finally, wire up the actual modal functionality and show the dialog
        $("#myModal").modal({
            "backdrop":"static",
            "keyboard":true,
            "show":true    // this parameter ensures the modal is shown immediately
        });
    }

    // set events
    $('#myModal form').submit(submitName);
    $("#myModal a.btn").click(submitName);
    $("#logout").click(logout);

    // set socket
    var socket = io.connect(server);

    socket.on('message', function (msg) {
        var messageHtml = '<tr><td style="width:20%; color:' + escape(msg.colorCode) + ';' 
	    + (msg.name == "わけち" ? "font-weight:bold;" : "") + '">'+ escape(msg.name) + '</td><td class="width:80%;">' + 
		escape(msg.input) + "</td></tr>"
        $("#messages").prepend(messageHtml);
    });
    $("#message_form").submit(
		    function() {
			    var name = $.cookie('name');
			    var message = $('#message').val();
			    if (name.length == 0 || message.length == 0) {
				return false;
			    }
			    if (message == messageBak) {
				return false;
			    }
			    console.log(name + ":" + message);
			    socket.emit('message', {
				    name:name,
				    input:message
			    });
			    messageBak = $("#message"); // bak message 
			    $("#message").val("");
			    return false;
		    });
		    

    return false;
});

