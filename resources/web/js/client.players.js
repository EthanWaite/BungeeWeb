// Players page
pages.players = (function() {	
	// When the page is navigated to
	function navigate() {
		$('#players .row').remove();
		query('api/getservers', function(data) {
			var i = 0;
			for (server in data) {
				if (i % 3 == 0) $('#players').append('<div class="row"></div>');
				$('#players .row').last().append('<div class="server" data-server="' + server + '"><h4>' + server + '</h4><span></span></div>');
				i++;
			}
			updatePlayers(data);
		});
	}
	
	// When the data needs to be updated
	function update(lastUpdate) {
		query('api/getservers', updatePlayers);
	}
	
	// Player update handler
	function updatePlayers(data) {
		for (server in data) {
			var entries = '';
			for (uuid in data[server]) {
				user = data[server][uuid];
				entries += '<a class="playerlink" data-player="' + uuid + '"><img src="https://cravatar.eu/avatar/' + user + '" title="' + user + '" class="playericon" />';
			}
			$('#players .server[data-server="' + server + '"] span').html(entries);
		}
	}
	
	// Player search handler
	$('#players .search').submit(function(e) {
		query('api/getuuid?username=' + $(this).find('input[name="player"]').val(), function(data) {
			if (data) showPlayer(data.uuid);
		});
		e.preventDefault();
	});
	
	return {
		navigate: navigate,
		update: update
	}
})();