/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */
 
// Load handler
$(document).ready(function() {
	$.get('/api/isloggedin', function(data) {
		parse(data, function(json) {
			if (json.result == 'true') $('.login').hide(0, loadClient);
		});
	});
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
	var href = $(this).attr('href');
	if (href.indexOf('#') != 0) return;
	e.preventDefault();
	
	if ($(this).hasClass('active') && href != '#dropdown') return;
	$('.navbar .active').removeClass('active');
	$(this).addClass('active');
	
	switch(href.substring(1)) {
		case 'dashboard': loadDashboard(); break;
		case 'players': loadPlayers(); break;
		case 'logs': loadLogs(); break;
		case 'dropdown':
			var el = $('.dropdown > div');
			if (el.hasClass('active')) {
				el.fadeOut(500);
			}else{
				el.fadeIn(500);
			}
			el.toggleClass('active');
			return;
			break;
	}
	$('.client > div.active').removeClass('active').fadeOut(500, function() {
		$('.client > ' + href).addClass('active').fadeIn(500);
	});
});

// Player link click handler
$('.client').on('click', '.playerlink', function() {
	showPlayer($(this).attr('data-player'));
});

// Player search handler
$('#players .search').submit(function(e) {
	$.get('/api/getuuid?username=' + $(this).find('input[name="player"]').val(), function(data) {
		parse(data, function(json) {
			if ("uuid" in json) showPlayer(json.uuid);
		});
	});
	e.preventDefault();
});

// Dialog escape handler
$('.mask').click(function() {
	$(this).fadeOut(1000, function() {
		$('body').css({ 'overflow': 'visible' });
	});
});
$('.dialog').click(function(e) {
	e.stopPropagation();
});
$('.dialog .close').click(function() {
	$('.mask').click();
});

// Initial client loader
function loadClient() {
	$('.navbar').slideDown(800);
	$('.dropdown').show();
	$('#dashboard, .footer').addClass('active').fadeIn(1000);
	loadDashboard();
	loadTypes();
}

// Types loader
var types = {};
function loadTypes() {
	$.get('/api/gettypes', function(data) {
		parse(data, function(json) {
			types = json;
		});
	});
}

// Dashboard loader
function loadDashboard() {
	$('#dashboard .log').html('');
	var players = 0;
	$.get('/api/listservers', function(data) {
		parse(data, function(json) {
			var i = 0;
			for (server in json) {
				$('#dashboard .servers .log').append('<li>' + server + '<span class="badge">' + json[server] + '</span></li>');
				players = players + json[server];
				i++;
			}
			$('#dashboard .servers h1 span').text(i + ' servers');
			
			if (i < 5) i = 5;
			$.get('/api/getlogs?limit=' + i, function(data) {
				parse(data, function(json) {
					for (item in json) {
						$('#dashboard .logs .log').append('<li>' + formatLog(json[item], true) + '</li>');
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

// Filters loader
function setFilters(el) {
	el.find('a').remove();
	for (t in types) {
		el.append('<a data-type-id="' + t + '">' + types[t] + '</a>');
	}
}

// Filter string
function getFilters(el) {
	var filter = '';
	el.find('a').each(function() {
		if ($(this).hasClass('active')) {
			filter += $(this).attr('data-type-id') + ',';
		}
	});
	return (filter == '' ? filter : filter.substring(0, filter.length - 1));
}

// Logs loader
function loadLogs() {
	setFilters($('#logs .filters'));
	resetLogs();
}

// Logs reset
function resetLogs() {
	addLogs(0, getFilters($('#logs .filters')));
}

// Logs retrieval
function addLogs(offset, filter, cb) {
	var limit = 50;
	$.get('/api/getlogs?offset=' + offset + '&filter=' + filter + '&limit=' + limit, function(data) {
		parse(data, function(json) {
			if (offset == 0) $('#logs .log').html('');
			for (item in json) {
				var d = new Date(json[item]['time'] * 1000);
				$('#logs .log').append('<li><div class="left">' + formatLog(json[item], true) + '</div> <div class="right">' + d.toLocaleString() + '</div></li>');
			}
			if (json.length == limit) $('#logs .log').append('<li class="more">Show more</li>');
			if (cb !== undefined) cb();
		});
	});
}

// Logs filter
$('#logs .filters').on('click', 'a', function() {
	$(this).toggleClass('active');
	resetLogs();
});

// Logs "show more" button handler
$('#logs .log').on('click', '.more', function() {
	var more = $('#logs .log .more');
	more.removeClass('more').text('Loading...');
	addLogs($('#logs li').size() - 1, getFilters($('#logs .filters')), function() {
		more.remove();
	});
});

// Players overview loader
function loadPlayers() {
	$('#players .row').remove();
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
	$('body').css({ 'overflow': 'hidden' });
	$('#playerinfo').attr('data-uuid', uuid).hide(0);
	$('.mask').fadeIn(1000);
	setFilters($('#playerinfo .filters'));
	resetPlayer(uuid);
}

// Player info retrieval
function resetPlayer(uuid) {
	addPlayerLogs(uuid, 0, getFilters($('#playerinfo .filters')));
}

// Player add logs
function addPlayerLogs(uuid, offset, filter, cb) {
	var limit = 30;
	$.get('/api/getlogs?uuid=' + uuid + '&offset=' + offset + '&filter=' + filter + '&limit=' + limit, function(data) {
		parse(data, function(json) {
			if (offset == 0) {
				$('#playerinfo .log').html('');
				var user = json[0].username;
				$('#playerinfo h1').text(user);
				$('#playerinfo h4').text(json[0].uuid);
				$('#playerinfo .log').html('');
				skinview.changeSkin(user);
			}
			
			for (item in json) {
				$('#playerinfo .log').append('<li>' + formatLog(json[item], false) + '</li>');
				if (json[item].username != user) {
					$('#playerinfo .log').append('<li>' + json[item].username + ' is now known as ' + user + '</li>');
					user = json[item].username;
				}
			}
			
			if (json.length == limit) $('#playerinfo .log').append('<li class="more">Show more</li>');
			if (cb !== undefined) cb();
			$('#playerinfo').addClass('active').slideDown(2000);
		});
	});
}

// Player logs filter
$('#playerinfo .filters').on('click', 'a', function() {
	$(this).toggleClass('active');
	resetPlayer($('#playerinfo').attr('data-uuid'));
});

// Player logs "show more" button handler
$('#playerinfo .log').on('click', '.more', function() {
	var more = $('#playerinfo .log .more');
	more.removeClass('more').text('Loading...');
	addPlayerLogs($('#playerinfo').attr('data-uuid'), $('#playerinfo .log li').size() - 1, getFilters($('#playerinfo .filters')), function() {
		more.remove();
	});
});

// Window scroll handler
$(window).scroll(function() {
	if ($('#logs').hasClass('active') && $(window).scrollTop() + $(window).height() > $(document).height() - 50) {
		$('#logs .log .more').click();
	}
});

// Mask scroll handler
$('.mask').scroll(function() {
	console.log('omg u scrollded!');
	console.log($('.mask').scrollTop() + $('.mask').height());
	console.log($('.mask')[0].scrollHeight);
	console.log($('#playerinfo').hasClass('active'));
	if ($('#playerinfo').hasClass('active') && $('.mask').scrollTop() + $('.mask').height() > $('.mask')[0].scrollHeight - 50) {
		$('#playerinfo .log .more').click();
	}
});

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
function formatLog(log, linked) {
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
	
	if (linked) {
		msg = msg.replace('{PLAYER}', '<a class="playerlink" data-player="{UUID}">{PLAYER}</a>');
	}
	
	return msg.replace('{PLAYER}', log.username)
		.replace('{UUID}', log.uuid)
		.replace('{CONTENT}', $('<div/>').text(log.content).html());
}

// Error handler
function error(err) {
	if (err === undefined) {
		var err = 'An internal error occurred when processing your request.';
	}
	$('.errorbar').text(err).slideDown(800).delay(4000).slideUp(800);
}