/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */

// Define variables
var groups = [ 'user', 'moderator', 'admin', 'superadmin' ];
var sessionid;
var sessionuser;
var sessiongroup;
var sessiontransitions;
 
// Load handler
$(document).ready(function() {
	updateSession(loadClient)
});

// Login handler
$('.login form').submit(function(e) {
	e.preventDefault();
	hide($('.login .error'));
	$.post('/login/', $(this).serialize()).done(function(data) {
		parse(data, function(json) {
			if (json.status == 1) {
				updateSession(function() {
					hide($('.login'), loadClient);
				});
			}else{
				$('.login .error').slideDown(500);
			}
		});
	});
});

// Session updater
function updateSession(cb) {
	$.get('/api/getsession', function(data) {
		parse(data, function(json) {
			sessiontransitions = json.transitions;
			if (json.group > 0) {
				sessionid = json.id;
				sessionuser = json.user;
				sessiongroup = json.group;
				cb();
			}else{
				show($('.login'));
			}
		});
	});
}

// Navigation handler
$('.navbar .right a, .dropdown a').click(function(e) {
	var href = $(this).attr('href');
	if (href.indexOf('#') != 0) return;
	e.preventDefault();
	
	if ($(this).hasClass('active') && href != '#dropdown') return;
	if (!$('.navbar .active[href="#dropdown"]').length) $('.navbar .active').removeClass('active');
	if ($(this).parent().hasClass('right')) $(this).toggleClass('active');
	
	switch(href.substring(1)) {
		case 'dashboard': loadDashboard(); break;
		case 'players': loadPlayers(); break;
		case 'logs': loadLogs(); break;
		case 'settings': loadSettings(); break;
		case 'dropdown':
			e.stopPropagation();
			var el = $('.dropdown > div');
			if (el.hasClass('active')) {
				hide(el);
			}else{
				show(el);
			}
			el.toggleClass('active');
			return;
			break;
	}
	hide($('.client > div.active').removeClass('active'), function() {
		show($('.client > ' + href).addClass('active'));
	});
});

// Dropdown hide handler
$(document).click(function() {
	if ($('.dropdown > div').hasClass('active') && $('.navbar .active').length) {
		$('.navbar .active').click();
	}
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
	if (sessiongroup < 2) $('.dropdown a[href="#settings"]').hide();
	
	if (sessiontransitions) {
		$('.navbar').slideDown(800);
	}else{
		$('.navbar').show();
	}
	
	$('.dropdown').show();
	show($('#dashboard, .footer').addClass('active'));
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
var timeout = null;
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
	
	if (timeout != null) clearTimeout(timeout);
	getStats(true);
}

// Stats loader
function getStats(initial) {
	if (!$('#dashboard').hasClass('active') && !initial) {
		timeout = null;
		return;
	}
	
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
					var t = i;
					
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
				xaxis: { mode: 'time' },
				yaxis: { min: 0, tickDecimals: 0 }
			});
			
			timeout = setTimeout(function() {
				getStats(false);
			}, json.increment * 1000);
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
				$('#logs .log').append('<li><div class="left">' + formatLog(json[item], true) + '</div> <div class="right fade">' + d.toLocaleString() + '</div></li>');
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

// Password change submission handler
$('.password').submit(function(e) {
	e.preventDefault();
	if ($(this).find('#newpass').val() != $(this).find('#confirmpass').val()) {
		error('Please ensure that your "Confirm Password" is the same as your "New Password".');
		return;
	}
	
	$.post('/api/changepassword', $(this).serialize()).done(function(data) {
		parse(data, function(json) {
			if (json.status == 1) {
				error('Your password has been changed.');
			}else{
				error('Your current password is incorrect.');
			}
		});
	});
});

// Server settings loader
function loadSettings() {
	$('#settings > div').removeClass('active').hide();
	$('#settings .userlist').addClass('active').show();
	updateUsers();
}

// Settings page switcher
function switchSettings(el) {
	hide($('#settings .active').removeClass('active'), function() {
		show($('#settings').find(el).addClass('active'));
	});
}

// Settings group updater
function updateGroups() {
	var sel = $('#settings select#group').html('');
	for (id in groups) {
		if (id > 0 && (id < sessiongroup || sessiongroup >= 3)) {
			sel.append('<option value="' + id + '">' + groups[id] + '</option>');
		}
	}
}

// Settings list updater
function updateUsers() {
	$('#settings .log').html('');
	$.get('/api/getusers', function(data) {
		parse(data, function(json) {
			for (item in json) {
				$('#settings .log').append('<li data-user-id="' + item + '" data-group-id="' + json[item].group + '"><div class="left"><span class="user">' + strip(json[item].user) + '</span> <span class="fade">(' + groups[json[item].group] + ')</span></div><div class="right"></li>');
				if (sessiongroup >= 3 || (sessiongroup > json[item].group && item != sessionid)) $('#settings .log li .right').last().append('<a class="edit btn btnsm">Edit</a>');
			}
		});
	});
}

// User create button handler
$('#settings #createbtn').click(function() {
	updateGroups();
	$('.useredit #id').val('0');
	$('.useredit input[type="text"], .useredit input[type="password"]').val('');
	$('.useredit .delete').hide();
	switchSettings('.useredit');
});

// User edit button handler
$('#settings .log').on('click', '.edit', function() {
	updateGroups();
	var li = $(this).closest('li');
	$('.useredit .delete').show();
	$('.useredit #id').val(li.attr('data-user-id'));
	$('.useredit #user').val(li.find('.user').text());
	$('.useredit #pass').val('password');
	$('.useredit #group option[value="' + li.attr('data-group-id') + '"]').prop('selected', true);
	switchSettings('.useredit');
});

// User delete button handler
$('#settings .delete').click(function() {
	if (window.confirm('Are you sure you wish to permanently delete this user? This action cannot be undone.')) {
		$.get('/api/deleteuser?id=' + $('.useredit #id').val(), function(data) {
			parse(data, function(json) {
				if (json.status == 1) {
					updateUsers();
					switchSettings('.userlist');
					error('The user has been deleted.');
				}else{
					error('An error occurred when deleting the user.');
				}
			});
		});
	}
});

// User cancel button handler
$('#settings .cancel').click(function() {
	switchSettings('.userlist');
});

// User edit form handler
$('#settings .useredit form').submit(function(e) {
	e.preventDefault();
	if ($(this).find('#id').val() > 0) {
		if ($(this).find('#pass').val() == 'password') $(this).find('#pass').val('');
		$.post('/api/edituser', $(this).serialize(), settingsHandler);
	}else{
		$.post('/api/createuser', $(this).serialize(), settingsHandler);
	}
});

// Settings ajax handler
function settingsHandler(data) {
	parse(data, function(json) {
		if (json.status == 1) {
			updateUsers();
			switchSettings('.userlist');
			error('The user\'s details have been updated.');
		}else{
			error('An error occurred when updating the user\'s details.');
		}
	});
}

// Window scroll handler
$(window).scroll(function() {
	if ($('#logs').hasClass('active') && $(window).scrollTop() + $(window).height() > $(document).height() - 50) {
		$('#logs .log .more').click();
	}
});

// Mask scroll handler
$('.mask').scroll(function() {
	if ($('#playerinfo').hasClass('active') && $('.mask').scrollTop() + $('.mask').height() > $('.mask')[0].scrollHeight - 50) {
		$('#playerinfo .log .more').click();
	}
});

// Show function
function show(el, cb) {
	if (sessiontransitions) {
		el.fadeIn(500, cb);
	}else{
		el.show();
		if (cb !== undefined) cb();
	}
}

// Hide function
function hide(el, cb) {
	if (sessiontransitions) {
		el.fadeOut(500, cb);
	}else{
		el.hide();
		if (cb !== undefined) cb();
	}
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
		.replace('{CONTENT}', strip(log.content));
}

// Parse text with HTML entities
function strip(content) {
	return $('<div/>').text(content).html();
}

// Error handler
function error(err) {
	if (err === undefined) {
		var err = 'An internal error occurred when processing your request.';
	}
	$('.errorbar').text(err).slideDown(800).delay(4000).slideUp(800);
}