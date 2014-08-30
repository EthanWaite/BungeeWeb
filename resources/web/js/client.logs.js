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
		
	}
	
	// Logs reset
	function resetLogs() {
		addLogs(0, getFilters($('#logs .filters')));
	}
	
	// Logs retrieval
	function addLogs(offset, filter, cb) {
		var limit = 50;
		query('/api/getlogs?offset=' + offset + '&filter=' + filter + '&limit=' + limit, function(data) {
			if (offset == 0) $('#logs .log').html('');
			for (item in data) {
				var d = new Date(data[item]['time'] * 1000);
				$('#logs .log').append('<li><div class="left">' + formatLog(data[item], true) + '</div> <div class="right fade">' + d.toLocaleString() + '</div></li>');
			}
			if (data.length == limit) $('#logs .log').append('<li class="more">Show more</li>');
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
		addLogs($('#logs li').size() - 1, getFilters($('#logs .filters')), function() {
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