// Dashboard page
pages.dashboard = (function() {
	var stats = {};
	var chart = {};
	
	// When the whole client is loaded
	function load() {
		// Graphs
		stats = { 'playercount': lang.dashboard.playercount, 'maxplayers': lang.dashboard.playerlimit, 'activity': lang.dashboard.loggeditems };
		Highcharts.setOptions({
			global: {
				useUTC: false
			}
		});
		
		getStatsData('', function(data) {
			chart = new Highcharts.StockChart({
				chart: { renderTo: 'graph-dashboard' },
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
	
	// When the page is navigated to
	function navigate() {
		// List of servers
		$('#dashboard .log').html('');
		var players = 0;
		query('/api/listservers', function(data) {
			var i = 0;
			for (server in data) {
				$('#dashboard .servers .log').append('<li>' + server + '<span class="badge">' + data[server] + '</span></li>');
				players = players + data[server];
				i++;
			}
			$('#dashboard .servers h1 span').text(i + ' ' + lang.dashboard.servers.toLowerCase());

			// Latest logs
			if (i < 5) i = 5;
			query('/api/getlogs?limit=' + i, function(data) {
				for (item in data) {
					$('#dashboard .logs .log').append('<li>' + formatLog(data[item], true) + '</li>');
				}
				$('#dashboard .logs h1 span').text(players + ' ' + lang.dashboard.players);
			});
		});
	}
	
	// When the data needs to be updated
	function update(lastUpdate) {
		getStatsData(lastUpdate, function(data, inc) {
			for (c in data) {
				var set = data[c].data;
				for (i in set) {
					chart.series[c].addPoint(set[i], true, true);
				}
			}
			increment = inc;
		});
	}
	
	// Retrieve the statistics for the graph
	function getStatsData(since, cb) {
		query('/api/getstats?since=' + since, function(data) {
			var out = [];
			for (c in stats) {
				out.push({
					name: stats[c],
					data: data.data[c]
				});
			}
			cb(out, data.increment);
		});
	}
	
	return {
		chart: function() { return chart; },
		load: load,
		navigate: navigate,
		update: update
	}
})();