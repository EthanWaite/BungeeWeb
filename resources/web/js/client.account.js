// Account settings page
pages.account = (function() {
	// Password change submission handler
	$('.password').submit(function(e) {
		e.preventDefault();
		if ($(this).find('#newpass').val() != $(this).find('#confirmpass').val()) {
			error(lang.error.passwordmismatch);
			return;
		}

		$.post('api/changepassword', $(this).serialize()).done(function(data) {
			data = parse(data);
			if (data.status == 1) {
				error(lang.error.passwordsuccess);
			}else{
				error(lang.error.passwordincorrect);
			}
		});
	});
	
	return {}
})();