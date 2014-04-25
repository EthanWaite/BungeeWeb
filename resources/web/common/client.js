/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */

// Login handler
$('.login form').submit(function(e) {
	e.preventDefault();
	$('.login .error').fadeOut(200);
	$.post('/login/', $(this).serialize()).done(function(data) {
		parse(data, function(json) {
			if (json.status == 1) {
				$('.login').fadeOut(1000, function() {
					$('.navbar').slideDown(800);
					$('#dashboard').fadeIn(1000);
					loadDashboard();
				});
			}else{
				$('.login .error').slideDown(500);
			}
		});
	});
});

// Dashboard loader
function loadDashboard() {
	var players = 0;
	$.get('/api/listservers', function(data) {
		parse(data, function(json) {
			var i = 0;
			for (server in json) {
				$('#dashboard .servers ul').append('<li>' + server + '<span class="badge">' + json[server] + '</span></li>');
				players = players + json[server];
				i++;
			}
			$('#dashboard .servers h1 span').text(i + ' servers');
			
			$.get('/api/getlogs?limit=5', function(data) {
				parse(data, function(json) {
					for (item in json) {
						$('#dashboard .logs ul').append('<li>' + formatLog(json[item]) + '</li>');
					}
					$('#dashboard .logs h1 span').text(players + ' players');
				});
			});
		});
	});
	
	$.get('/api/getstats', function(data) {
		parse(data, function(json) {
			if (json.length == 0) return;
			
			var cat = { 'playercount': 'Player count', 'maxplayers': 'Player limit', 'activity': 'Logged items' };
			
			var res = [];
			for (i in json) {
				var key = 0;
				for (c in cat) {
					if (res.length <= key) res.push([]);
					var v = json[i][c];
					if (v != -1) res[key].push([ i * 1000, v ]);
					key++;
				}
			}
			
			var key = 0;
			var out = [];
			for (c in cat) {
				out.push({
					legend: { show: true },
					label: cat[c],
					data: res[key],
					lines: { show: true }
				});
				key++;
			}
			
			$.plot('#dashboard .graph', out, {
				xaxis: { mode: 'time' }
			});
		});
	});
}

// JSON handler
function parse(data, cb) {
	try {
		var json = $.parseJSON(data);
		if ('error' in json) {
			error(json.error);
			return;
		}
	} catch(err) {
		error();
		return;
	}
	cb(json);
}

// Log handler
function formatLog(log) {
	switch(log.type) {
		case 1:
			var msg = '{PLAYER}: {CONTENT}';
			break;
		
		case 2:
			var msg = '{PLAYER} ran the command {CONTENT}';
			break;
		
		case 3:
			var msg = '{PLAYER} joined the proxy';
			break;
		
		case 4:
			var msg = '{PLAYER} disconnected from the proxy';
			break;
		
		case 5:
			var msg = '{PLAYER} was kicked from {CONTENT}';
			break;
		
		case 6:
			var msg = '{PLAYER} switched to {CONTENT}';
			break;
		
		default:
			var msg = '{CONTENT}';
	}
	
	return msg.replace('{PLAYER}', log.username)
		.replace('{CONTENT}', log.content);
}

// Error handler
function error(err) {
	if (err === undefined) {
		var err = 'An internal error occurred when processing your request.';
	}
	$('.errorbar').text(err).slideDown(800).delay(4000).slideUp(800);
}