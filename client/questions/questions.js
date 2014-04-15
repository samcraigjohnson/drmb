
var order = ["#hello", "#single", "#paid", "#made", "#rent", "#utils"];
var family_order = ["#kids", "#monthlyInc", "#rent", "#utils"]
var curr_ind = 0;
var isFamily = false;

Template.done.events = {
	'click a.button.success' : function(event){
		event.preventDefault();
		var moneyObj = {};
		moneyObj.checks = $('input:radio[name=pay-month]:checked').val();
		moneyObj.make = $("#make-input").val();
		moneyObj.rent = $("#rent-input").val();
		moneyObj.utils = $("#utils-input").val();
		moneyObj.family = isFamily;
		//moneyObj.age = $("#age-input").val();
		//moneyObj.zip = $("#location-input").val();

		if(isFamily){
			console.log("saveFamily stuff here: " + moneyObj);
		}
		
		Meteor.call("saveBudget", moneyObj, function(err, result){
			if(err){console.log(err);}
		});
	}
}

Template.next.events = {
	'click a.button.default' : function(event){
		event.preventDefault();
		var curr = order[curr_ind];
		var old_ind = 0;
		if (curr == "#single" && !isFamily){
			var val = $('input:radio[name=single-family]:checked').val();
			if(val == "family"){
				isFamily = true;
				old_ind = curr_ind;
				curr_ind = 0;
			}
		}
		console.log(curr+":"+curr_ind+", isFamily:"+isFamily);
		if(isFamily){
			if(curr_ind == 0){
				$(order[old_ind]).addClass("hidden");
				$(family_order[curr_ind]).removeClass("hidden");
				curr_ind++;
			}
			else{
				$(family_order[curr_ind-1]).addClass("hidden");
				curr_ind++;
				$(family_order[curr_ind-1]).removeClass("hidden");
			}
		}
		else{
			$(order[curr_ind]).addClass("hidden");
			curr_ind++;
			$(order[curr_ind]).removeClass("hidden");
		}
	}

}