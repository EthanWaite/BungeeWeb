/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */
 
// Load handler
$(document).ready(function() {
	$.get('/api/isloggedin', function(data) {
		parse(data, function(json) {
			if (json.result == 1) $('.login').hide(0, loadClient);
		});
	});
	skinview.changeSkin('Notch');
});

// Login handler
$('.login form').submit(function(e) {
	e.preventDefault();
	$('.login .error').fadeOut(200);
	$.post('/login/', $(this).serialize()).done(function(data) {
		parse(data, function(json) {
			if (json.status == 1) {
				$('.login').fadeOut(1000, loadClient);
			}else{
				$('.login .error').slideDown(500);
			}
		});
	});
});

// Navigation handler
$('.navbar .right a').click(function(e) {
	$('.navbar .active').removeClass('active');
	$(this).addClass('active');
	
	var href = $(this).attr('href');
	switch(href.substring(1)) {
		case 'dashboard': loadDashboard(); break;
		case 'players': loadPlayers(); break;
	}
	$('.client > div.active').fadeOut(1000, function() {
		$('.client > ' + href).fadeIn(1000);
	});
	e.preventDefault();
});

// Player link click handler
$('.playerlink').click(function() {
	showPlayer($(this).attr('data-player'));
});

// Initial client loader
function loadClient() {
	$('.navbar').slideDown(800);
	$('#dashboard').addClass('active').fadeIn(1000);
	loadDashboard();
}

// Dashboard loader
function loadDashboard() {
	$('#dashboard ul').html('');
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
			
			if (i < 5) i = 5;
			$.get('/api/getlogs?limit=' + i, function(data) {
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
			var entries = json.data;
			if (entries.length == 0) return;
			
			var cat = { 'playercount': 'Player count', 'maxplayers': 'Player limit', 'activity': 'Logged items' };
			
			var res = [];
			var last = 0;
			for (i in entries) {
				var key = 0;
				for (c in cat) {
					if (res.length <= key) res.push([]);
					var v = entries[i][c];
					var t = i * 1000;
					
					if (last > 0 && ((t - last) > json.increment)) {
						for (var n = last + json.increment; n < (t - json.increment); n = n + json.increment) {
							res[key].push([ n, null ]);
						}
					}
					
					last = t;
					if (v != -1) res[key].push([ t, v ]);
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

// Players overview loader
function loadPlayers() {
	$.get('/api/getservers', function(data) {
		parse(data, function(json) {
			var i = 0;
			for (server in json) {
				if (i % 3 == 0) $('#players').append('<div class="row"></div>');
				$('#players .row').last().append('<div class="server"><h4>' + server + '</h4></div>');
				for (uuid in json[server]) {
					user = json[server][uuid];
					$('#players .server').last().append('<a class="playerlink" data-player="' + uuid + '"><img src="https://minotar.net/avatar/' + user + '/32" title="' + user + '" class="playericon" />');
				}
				i++;
			}
		});
	});
}

// Player dialog
function showPlayer(uuid) {
	//TODO
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