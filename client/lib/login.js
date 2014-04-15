//LOGIN STUFF --------------------
function loginEvent(event){
	event.stopPropagation();	
	event.preventDefault();
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	Meteor.loginWithPassword(username, password, function(error){
		if(error){ 
			console.log("EROOR");
			//$("#login-unsuc").removeClass('hidden');
		}
	});
}

function createEvent(event){
	event.stopPropagation();	
	event.preventDefault();
	var username = document.getElementById('usernameCreate').value;
	var password = document.getElementById('passwordCreate').value;
	Accounts.createUser({username: username, password: password}, function(error){
		if(error){console.log("error");}
		else{
			Meteor.loginWithPassword(username, password); 
			console.log("created")
		}
	});
}

Template.login.events = {
	'click a#loginBtn' : loginEvent,
	'keydown input#password' : function(event){
		if(event.which == 13){
			loginEvent(event);
		}
	},
	'click a#createBtn' : createEvent,
	'keydown input#passwordCreate' : function(event){
		if(event.which == 13){
			createEvent(event);
		}
	}
}

Template.nav.events = {
	'click a#logoutBtn' : function(event){
		Meteor.logout();
	}
}