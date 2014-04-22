/**
 * BungeeWeb
 * https://github.com/Dead-i/BungeeWeb
 */

// Login handler
$('.login form').submit(function(e) {
	e.preventDefault();
	$('.login .error').fadeOut(200);
	$.post('/login/', $(this).serialize()).done(function(data) {
		try {
			var json = JSON.parse(data);
		} catch(e) {
			error();
			return;
		}
		
		if (json.status == 1) {
			$('.login').fadeOut(1000, function() {
				$('.navbar').slideDown(800);
				$('div[data-page="home"]').fadeIn(1000);
			});
		}else{
			$('.login .error').slideDown(500);
		}
	});
});

// Error handler
function error() {
	$('.errorbar').slideDown(800).delay(4000).slideUp(800);
}