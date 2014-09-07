/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */

// Define variables
var groups = [];
var lang = {};
var session = {};
var pages = {};
var activepage = {};

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
		var data = parse(data);
		if (data.status == 1) {
			updateSession(function() {
				hide($('.login'), loadClient);
			});
		}else{
			$('.login .error').slideDown(500);
		}
	});
});

// Session updater
function updateSession(cb) {
	query('/api/getsession', function(data) {
		session = data;
		if (data.group > 0) {
			cb();
		}else{
			show($('.login'));
		}
	});
}

// Language updater
function updateLang(cb) {
	query('/api/getlang', function(data) {
		lang = data.language;
		groups = lang.groups;
		$('[data-lang]').each(function() {
			var id = $(this).attr('data-lang');
			var split = id.split('.');
			var out = lang;
			for (i in split) {
				out = out[split[i]];	
			}

			if ($(this).hasClass('langcaps')) {
				out = out.toUpperCase();
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
}

// Navigation handler
$('.navbar .right a, .dropdown a').click(function(e) {
	var href = $(this).attr('href');
	var link = href.substring(1);
	
	if (href.indexOf('#') != 0 && $('.client > #' + link).length == 0) return;	
	e.preventDefault();
	
	if ($(this).hasClass('active') && href != '#dropdown') return;
	if (!$('.navbar .active[href="#dropdown"]').length) $('.navbar .active').removeClass('active');
	if ($(this).parent().hasClass('right')) $(this).toggleClass('active');
	
	if (link == 'dropdown') {
		e.stopPropagation();
		var el = $('.dropdown > div');
		if (el.hasClass('active')) {
			hide(el);
		}else{
			show(el);
		}
		el.toggleClass('active');
		return;
	}
	
	window.history.pushState({}, '', href);
	hide($('.client > div.active').removeClass('active'), function() {
		show($('.client > #' + link).addClass('active'));
		if (link in pages && 'navigate' in pages[link]) {
			activepage = pages[link];
			activepage.navigate();
		}
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
	loadTypes(function() {
		if (session.group < 2) $('.dropdown a[href="#settings"]').hide();
		
		for (page in pages) {
			if ('load' in pages[page]) {
				pages[page].load();
			}
		}
		
		if (session.transitions) {
			$('.navbar').slideDown(800);
		}else{
			$('.navbar').show();
		}

		show($('#dashboard, .footer').addClass('active'));
		var path = window.location.pathname.split('/')[1];
		if (path != '' && $('.client > #' + path).length) {
			activepage = pages[path];
			if (activepage && activepage.navigate) activepage.navigate();
			
			$('.client > div.active').hide().removeClass('active');
			show($('.client > #' + path).addClass('active'));
			
			$('.navbar .active').removeClass('active');
			var link = 'a[href="/' + path + '"]';
			$('.navbar ' + link + ', .dropdown ' + link).addClass('active');
		}else{
			activepage = pages.dashboard;
			activepage.navigate();
		}
		
		if (session.updatetime > 0) {
			var lastupdate = 0;
			setInterval(function() {
				if (activepage.update && lastupdate > 0) activepage.update(lastupdate);
				lastupdate = Math.floor(new Date().getTime() / 1000);
			}, session.updatetime * 1000);
		}
	});
}

// Types loader
var types = {};
function loadTypes(cb) {
	query('/api/gettypes', function(data) {
		for (id in data) {
			if (id in lang.logs) {
				types[id] = lang.logs[id].type;	
			}else{
				types[id] = data[id];
			}
		}
		if (cb !== undefined) cb();
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

// Player dialog
function showPlayer(uuid) {
	$('body').css({ 'overflow': 'hidden' });
	$('#playerinfo').attr('data-uuid', uuid).hide(0);
	if (session.transitions) $('.mask').fadeIn(1000);
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
	query('/api/getlogs?uuid=' + uuid + '&offset=' + offset + '&filter=' + filter + '&limit=' + limit, function(data) {
		if (offset == 0) {
			$('#playerinfo .log').html('');
			var user = data[0].username;
			$('#playerinfo h1').text(user);
			$('#playerinfo .uuid').text(data[0].uuid);
			$('#playerinfo .log').html('');
			skinview.changeSkin(user);
		}

		for (item in data) {
			$('#playerinfo .log').append('<li>' + formatLog(data[item], false) + '</li>');
			if (data[item].username != user) {
				$('#playerinfo .log').append('<li>' + data[item].username + ' is now known as ' + user + '</li>');
				user = data[item].username;
			}
		}

		if (data.length == limit) $('#playerinfo .log').append('<li class="more">Show more</li>');
		if (cb !== undefined) cb();
		$('#playerinfo').addClass('active').show();
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

// Mask scroll handler
$('.mask .logs').scroll(function() {
	if ($('#playerinfo').hasClass('active') && $('.mask .logs').scrollTop() + $('.mask .logs').height() > $('.mask .logs')[0].scrollHeight - 50) {
		$('#playerinfo .log .more').click();
	}
});

// Show function
function show(el, cb) {
	if (session.transitions) {
		el.fadeIn(300, cb);
	}else{
		el.show(0, cb);
	}
}

// Hide function
function hide(el, cb) {
	if (session.transitions) {
		el.fadeOut(300, cb);
	}else{
		el.hide(0, cb);
	}
}

// API query handler
function query(url, cb, msg) {
	$.get(url, function(data) {
		cb(parse(data, msg));
	});
}

// JSON handler
function parse(data, msg) {
	try {
		var json = $.parseJSON(data);
		if ('error' in json) {
			error(json.error);
			return;
		}
	} catch(err) {
		console.log(err);
		error(msg || lang.error.internal);
		return;
	}
	return json;
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