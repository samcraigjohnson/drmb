Template.editInfo.events = {
	'click a#back-to-budget' : function(event){
		$("#edit-main").slideToggle();
		$("#budget-main").slideToggle();
		//Session.set("editHidden", "hidden");
		//Session.set("mainHidden", "");
	}
}

Template.editInfo.editHidden = function(){
	return Session.get("editHidden", "hidden");
}

Template.personalInfo.personalObjs = function(){
	var ud = UserData.findOne({});
	var pol = [];
	for(item in ud){
		if(ud.hasOwnProperty(item) && item != "_id" && item != "user"){
			var obj = {};
			var value = "$" + ud[item];
			var name;
			if(item == "checks"){
				value = ud[item];
				name = "Paychecks per month"
			}
			else if(item == "make"){
				name = "Amount per paycheck"
			}
			else if(item == "rent"){
				name = "Rent/Mortgage"
			}
			else if(item == "utils"){
				name = "Utilities"
			}
			obj.value = value;
			obj.name = name;
			obj.cat = item;
			pol.push(obj);
		}
	}

	return pol;
}

Template.personalInfo.events = {
	'click a.info-editable-text' : function(event){
		var targ = $(event.target);

		var text = targ.text();
		var money = "";
		if(isMoney(text)){
			text = text.substring(1, text.length);
			money = "edit-money-text"
		}
		var new_id = targ.attr('id').substring(0, targ.attr('id').length-6);
		var input="<label class='error inline'>"
		input +="<input type='text' id="+new_id+" class='edit-info-text money-info-text' value="+text+">";
		input += "</label><small class='error' id='edit-error'>Numbers only</small>";

		targ.closest("h3").html(input);
	},

	'keypress input.edit-info-text' : function(event){
		if(event.keyCode == 13){
			var targ = $(event.target);
			console.log(targ.val() + ": " + targ.attr('id'));
			var ud = UserData.findOne({});
			ud[targ.attr('id')] = targ.val();
			Meteor.call("updateBudget", ud, function(error, result){
				if(error){
					console.log(error);
				}
			});
		}
	}
}

function isMoney(text){
	if(text.substring(0,1) == "$"){
		return true;
	}
	return false;
}