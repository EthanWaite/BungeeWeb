/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */

// Define variables
var groups = [];
var lang = {};
var session = {};
 
// Load handler
$(document).ready(function() {
	updateLang(function() {
		updateSession(loadClient);
	});
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
			session = json;
			if (json.group > 0) {
				cb();
			}else{
				show($('.login'));
			}
		});
	});
}

// Language updater
function updateLang(cb) {
	$.get('/api/getlang', function(data) {
		parse(data, function(json) {
			lang = json.language;
			groups = lang.groups;
			$('[data-lang]').each(function() {
				var id = $(this).attr('data-lang');
				var split = id.split('.');
				var out = lang;
				for (i in split) {
					out = out[split[i]];	
				}
				
				if ($(this).hasClass('langval')) {
					$(this).val(out);
				}else if ($(this).hasClass('langholder')) {
					$(this).attr('placeholder', out);
				}else{
					$(this).prepend(out);
				}
			});
			cb();
		}, 'Your language file has incorrect JSON. Please check your JSON formatting and try again.');
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

// Logo click handler
$('.navbar h1').click(function() {
	$('.navbar a[href="#dashboard"]').click();
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
	if (session.group < 2) $('.dropdown a[href="#settings"]').hide();
	
	if (session.transitions) {
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
			for (id in json) {
				if (id in lang.logs) {
					types[id] = lang.logs[id].type;	
				}else{
					types[id] = json[id];
				}
			}
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
			$('#dashboard .servers h1 span').text(i + ' ' + lang.dashboard.servers.toLowerCase());
			
			if (i < 5) i = 5;
			$.get('/api/getlogs?limit=' + i, function(data) {
				parse(data, function(json) {
					for (item in json) {
						$('#dashboard .logs .log').append('<li>' + formatLog(json[item], true) + '</li>');
					}
					$('#dashboard .logs h1 span').text(players + ' ' + lang.dashboard.players);
				});
			});
		});
	});
	
	if (timeout != null) clearTimeout(timeout);
	getStats();
}

// Stats loader
var stats = {};
function getStats() {
	stats = { 'playercount': lang.dashboard.playercount, 'maxplayers': lang.dashboard.playerlimit, 'activity': lang.dashboard.loggeditems };
	
	if (!$('#dashboard').hasClass('active') && !initial) {
		timeout = null;
		return;
	}
	
	Highcharts.setOptions({
		global: {
			useUTC: false
		}
	});
	
	var increment;
	getStatsData('', function(data, inc) {
		increment = inc;
		var last = new Date().getTime() / 1000;
		$('#dashboard .graph').highcharts('StockChart', {
			chart: {
				events: {
					load: function() {
						var series = this.series;
						timeout = setInterval(function() {
							getStatsData(Math.floor(last), function(data, inc) {
								for (c in data) {
									console.log('Plotting:');
									console.log(data[c].data);
									series[c].addPoint(data[c].data, true, true);
								}
								last = new Date().getTime() / 1000;
								increment = inc;
							});
						}, increment * 1000);	
					}
				}
			},
			series: data,
			yAxis: { min: 0 },
			rangeSelector: {
				buttons: [
					{
						count: 1,
						type: 'hour',
						text: '1h'
					},
					{
						count: 3,
						type: 'hour',
						text: '3h'
					},
					{
						count: 1,
						type: 'day',
						text: '1d'
					},
					{
						count: 1,
						type: 'week',
						text: '1w'
					},
					{
						count: 2,
						type: 'week',
						text: '2w'
					},
					{
						count: 1,
						type: 'month',
						text: '1m'
					}
				],
				inputEnabled: true,
				selected: 0
			}
		});
	});
}

// Stats data loader
function getStatsData(since, cb) {
	console.log('Calling to /api/getstats?since=' + since);
	$.get('/api/getstats?since=' + since, function(data) {
		parse(data, function(json) {
			console.log(json.data);
			var out = [];
			for (c in stats) {
				out.push({
					name: stats[c],
					data: json.data[c]
				});
			}
			cb(out, json.increment);
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
	more.removeClass('more').text(lang.logs.loading);
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
		error(lang.error.passwordmismatch);
		return;
	}
	
	$.post('/api/changepassword', $(this).serialize()).done(function(data) {
		parse(data, function(json) {
			if (json.status == 1) {
				error(lang.error.passwordsuccess);
			}else{
				error(lang.error.passwordincorrect);
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
		if (id > 0 && (id < session.group || session.group >= 3)) {
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
				if (session.group >= 3 || (session.group > json[item].group && item != session.id)) $('#settings .log li .right').last().append('<a class="edit btn btnsm">Edit</a>');
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
					error(lang.error.deletesuccess);
				}else{
					error(lang.error.deleteerror);
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
			error(lang.error.modifysuccess);
		}else{
			error(lang.error.modifyerror);
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
	if (session.transitions) {
		el.fadeIn(500, cb);
	}else{
		el.show();
		if (cb !== undefined) cb();
	}
}

// Hide function
function hide(el, cb) {
	if (session.transitions) {
		el.fadeOut(500, cb);
	}else{
		el.hide();
		if (cb !== undefined) cb();
	}
}

// JSON handler
function parse(data, cb, msg) {
	try {
		var json = $.parseJSON(data);
		if ('error' in json) {
			error(json.error);
			return;
		}
	} catch(err) {
		error(msg);
		return;
	}
	cb(json);
}

// Log handler
function formatLog(log, linked) {
	msg = lang.logs[log.type].entry;
	
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
		var err = lang.error.internal || 'An internal error occurred when processing your request.';
	}
	$('.errorbar').text(err).slideDown(800).delay(4000).slideUp(800);
}