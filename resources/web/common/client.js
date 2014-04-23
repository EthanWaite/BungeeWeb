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
	$.get('/api/listservers', function(data) {
		parse(data, function(json) {
			var i = 0;
			for (server in json) {
				$('#dashboard .servers ul').append('<li>' + server + '<span class="badge">' + json[server] + '</span></li>');
				i++;
			}
			$('#dashboard .servers h1 span').text(i + ' servers');
		});
	});
}

// JSON handler
function parse(data, cb) {
	try {
		var json = JSON.parse(data);
		cb(json);
	} catch(err) {
		error();
	}
}

// Error handler
function error() {
	$('.errorbar').slideDown(800).delay(4000).slideUp(800);
}