// Server settings page
pages.settings = (function() {	
	// When the page is navigated to
	function navigate() {
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
		query('api/getusers', function(data) {
			for (item in data) {
				$('#settings .log').append('<li data-user-id="' + item + '" data-group-id="' + data[item].group + '"><div class="left"><span class="user">' + strip(data[item].user) + '</span> <span class="fade">(' + groups[data[item].group] + ')</span></div><div class="right"></li>');
				if (session.group >= 3 || (session.group > data[item].group && item != session.id)) $('#settings .log li .right').last().append('<a class="edit btn btnsm">Edit</a>');
			}
		});
	}
	
	// Settings ajax handler
	function settingsHandler(data) {
		var data = parse(data);
		if (data.status == 1) {
			updateUsers();
			switchSettings('.userlist');
			error(lang.error.modifysuccess);
		}else{
			error(lang.error.modifyerror);
		}
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
			query('api/deleteuser?id=' + $('.useredit #id').val(), function(data) {
				if (data.status == 1) {
					updateUsers();
					switchSettings('.userlist');
					error(lang.error.deletesuccess);
				}else{
					error(lang.error.deleteerror);
				}
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
			$.post('api/edituser', $(this).serialize(), settingsHandler);
		}else{
			$.post('api/createuser', $(this).serialize(), settingsHandler);
		}
	});
	
	return {
		navigate: navigate
	}
})();