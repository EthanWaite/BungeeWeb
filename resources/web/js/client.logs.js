// Logs page
pages.logs = (function() {
	// When the whole client is loaded
	function load() {
		setFilters($('#logs .filters'));
	}
	
	// When the page is navigated to
	function navigate() {
		resetLogs();
	}
	
	// When the data needs to be updated
	function update(lastUpdate) {
		addLogs(0, lastUpdate, 'prepend');
	}
	
	// Logs reset
	function resetLogs() {
		$('#logs .log').html('');
		addLogs(0, 0);
	}
	
	// Logs retrieval
	function addLogs(offset, time, position, cb) {
		var limit = 50;
		query('/api/getlogs?offset=' + offset + '&time=' + time + '&filter=' + getFilters($('#logs .filters')) + '&limit=' + limit, function(data) {
			var entries = '';
			for (item in data) {
				var d = new Date(data[item]['time'] * 1000);
				entries += '<li class="entry"><div class="left">' + formatLog(data[item], true) + '</div> <div class="right fade">' + d.toLocaleString() + '</div></li>';
			}
			
			if (position == 'prepend') {
				$('#logs .log').prepend(entries);
			}else{
				$('#logs .log').append(entries);
			}
			
			if (data.length == limit && $('#logs .log .more').length == 0) $('#logs .log').append('<li class="more">Show more</li>');
			if (cb !== undefined) cb();
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
		addLogs($('#logs li').size() - 1, 0, 'append', function() {
			more.remove();
		});
	});
	
	// Window scroll handler
	$(window).scroll(function() {
		if ($('#logs').hasClass('active') && $(window).scrollTop() + $(window).height() > $(document).height() - 50) {
			$('#logs .log .more').click();
		}
	});
	
	return {
		load: load,
		navigate: navigate,
		update: update
	}
})();