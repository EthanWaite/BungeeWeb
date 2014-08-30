// Players page
pages.players = (function() {	
	// When the page is navigated to
	function navigate() {
		$('#players .row').remove();
		query('/api/getservers', function(data) {
			var i = 0;
			for (server in data) {
				if (i % 3 == 0) $('#players').append('<div class="row"></div>');
				$('#players .row').last().append('<div class="server"><h4>' + server + '</h4></div>');
				for (uuid in data[server]) {
					user = data[server][uuid];
					$('#players .server').last().append('<a class="playerlink" data-player="' + uuid + '"><img src="https://minotar.net/avatar/' + user + '/32" title="' + user + '" class="playericon" />');
				}
				i++;
			}
		});
	}
	
	// When the data needs to be updated
	function update(lastUpdate) {
		
	}
	
	return {
		navigate: navigate,
		update: update
	}
})();