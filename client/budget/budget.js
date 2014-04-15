$(function() {
	$(document).tooltip();
});

Template.budget.mainHidden = function(){
	return Session.get("mainHidden", "");
}
//register to create transaction rows
Handlebars.registerHelper('transaction', function(trans){
	var html = ["<tr id="+trans.id+" class='transaction-row'>",
				"<td class='amt-td'> <a title='Edit' href='#'' class='editable-text money-text'>$"+trans.amount+" </a></td>",
				"<td class='date-td'> "+trans.date+" </td>",
				"<td class='descr-td'> <a title='Edit' href='#'' class='editable-text'>"+trans.description+" </a></td>",
				"<td class='del-td'><a class='button tiny alert my-alert delete-button'>DEL</a> </td>",
				"</tr>"].join('\n');

	return new Handlebars.SafeString(html);
});


var cats = ['fun', 'food', 'trans', 'bills', 'rent'];
var display = [
	{name: "Fun", id: "fun"},
	{name: "Food", id: "food"},
	{name: "Transportation", id: "trans"},
	{name: "Home", id: "rent"},
	{name: "Bills", id: "bills"}
	];

Template.moneyDash.events = {
	'click a#test-make-expense' : function(event){
		Meteor.call("createExpenses", function(err, result){
			if(err){
				console.log(err);
			}
		});
	},
	'click a#edit-info' : function(event){
		$("#budget-main").slideToggle();
		$("#edit-main").slideToggle();
		//Session.set("mainHidden", "hidden");
		//Session.set("editHidden", "");
	}
}

Template.budgetProgress.updateMe = function (){
	return Session.get("updatedTrans");
}

Template.budgetProgress.month = function (){
	return moment().format("MMMM");
}

Template.moneyDash.total = function (){
	if(Expenses.find({}).count() > 0){
		var exp = Expenses.findOne({});
		var budj_obj = getBudjObj();

		var spending = 0.0;
		var save = 0.0;

		for(var i = 0; i < exp.spending.length; i++){
			spending += parseFloat(exp.spending[i].amount);
		}

		var left = budj_obj.total - spending - budj_obj.save;
		Session.set("left", left);

		return left;
	}
}

Template.budgetProgress.budj = function (){
	return getBudjObj();
}

Template.budgetProgress.rendered = function(){
	_.each(cats, getSpending);
	checkExpenses();
}

//fun stuff
Template.budgetProgress.funSpending = function(){
	return getSpending('fun');
}
Template.budgetProgress.funTransaction = function(){
	return getTransaction('fun');
}

//food stuff
Template.budgetProgress.foodSpending = function(){
	return getSpending('food');
}
Template.budgetProgress.foodTransaction = function(){
	return getTransaction('food');
}

//transportation stuff
Template.budgetProgress.transSpending = function(){
	return getSpending('trans');
}
Template.budgetProgress.transTransaction = function(){
	return getTransaction('trans');
}

//rent stuff
Template.budgetProgress.rentSpending = function(){
	return getSpending('rent');
}
Template.budgetProgress.rentTransaction = function(){
	return getTransaction('rent');
}

//bills stuff
Template.budgetProgress.billsSpending = function(){
	return getSpending('bills');
}
Template.budgetProgress.billsTransaction = function(){
	return getTransaction('bills');
}

Template.addExpense.category = function(){
	return display;
}

Template.budgetProgress.savingThisMonth = function(){
	return Session.get("left") + getBudjObj().save;
}

Template.saveProgress.savingsGoals = function(){
	var goals = [];
	var sGoals = SavingsGoals.find({}); 
	if(sGoals.count() > 0){
		sGoals.forEach(function(savingsObj){
			savingsObj.monthsLeft = savingsObj.months - moment(savingsObj.date).diff(moment(), "months");
			goals.push(savingsObj);
		});

		if(sGoals.count >= 3){
			$("#add-savings-goal").hide();
		}
	}

	return goals;
}

Template.addExpense.events = {

	'click a.cat-add' : function (event){
		event.preventDefault();
		event.stopPropagation();

		var id = event.target.id
		var propName = $("#cats-dropdown").val();
		var expense = $("#expense-input").val();
		var descr = $("#descr-input").val();
		var valid = (expense.match(/^-?\d*(\.\d+)?$/));
		if (valid && expense != ''){
			$("#amount-error").css('display', 'none');
			Meteor.call('addExpense', expense, propName, descr, function(error){
				if(error){console.log(error);}
			});
		}
		else{
			$("#amount-error").css('display', 'block');
		}

		$("#drop1").slideToggle();
		$("#expense-input").val('')
		$("#descr-input").val('');
		Session.set("lastChanged", propName);
	},

	'keyup input#expense-input': function(event){
		var val = $("#expense-input").prop("value");
		if(checkValNum(val) || val == ''){
			$("#amount-error").css('display', 'none');
		}
		else{
			$("#amount-error").css('display', 'block');
		}
	}

}

Template.saveProgress.events = {
	'click div.save-row' : function(event){
		event.preventDefault();
		if(!$(event.target).parents('.settings-row').length > 0){
			$(event.target).closest('.save-row').find(".settings-row").slideToggle();
		}
	},

	'click a.save-editable-text' : function(event){
		var targ = $(event.target);
		var value = targ.text()

		if(targ.hasClass("save-money-text")){
			var input="<label class='error inline'>"
			input +="<input type='text' class='save-edit-text money-text-edit' value="+value.substring(1,value.length)+">";
			input += "</label><small class='error' id='edit-error'>Numbers only</small>";	
		}
		else{
			var input="<input type='text' class='save-edit-text' value='"+value+"''>";
		}
		var parent = targ.parent('.edit-area');
		Session.set("old_html", parent.html())
		parent.html(input);
		parent.find('.save-edit-text').focus();
		parent.find('.save-edit-text').blur(function(){
			var val = $(this).val();
			if(checkValNum(val) && val != ''){
				editSave(false, $(this));
			}
		});
	},
	'keydown .save-edit-text' : function(event){
		if(event.keyCode == 13){
			//event.preventDefault();
			var val = $(event.target).val();
			console.log(val);
			if(checkValNum(val) && val != ''){
				editSave(false, $(event.target));
			}
		}
	},
	'click a.goal-delete' : function(event){
		editSave(true, $(event.target));
	}
}

Template.budgetProgress.events = {
	'click div.prog-row' : function(event){
		event.preventDefault();
		var $targ = $(event.target);
		if(!$targ.parents('.transaction-body').length > 0 && !$targ.parents('.edit-wrapper').length > 0){
			$targ.closest('.prog-row').find(".settings-row").slideToggle();
		}
	},

	'click a.delete-button' : function(event){
		event.preventDefault();
		editTrans(true, $(event.target));
	},

	'click a.editable-text' : function(event){
		var targ = $(event.target);
		var value = targ.text();
		if(targ.hasClass("money-text")){
			var input = "<label class='error'>";
			input +="<input type='text' class='edit-text money-text-edit' value="+value.substring(1,value.length)+">";	
			input += "</label><small class='error' id='edit-error'>Numbers only</small>";
		}
		else{
			var input="<input type='text' class='edit-text dur-text' value='"+value+"''>";
		}
		var parent = targ.parent('td')
		parent.html(input);
		parent.find('.edit-text').focus();
		parent.find('.edit-text').blur(function(){
			editTrans(false, $(this));
		});
	},

	'click a.budget-editable-text' : function(event){
		var targ = $(event.target);
		var value = targ.text();
		var input = "<label class='error inline'>";
		input +="<input type='text' class='budget-edit-field' value="+value.substring(1,value.length)+">";	
		input += "</label><small class='error' id='edit-error'>Numbers only</small>";

		var wrapper = targ.parent(".edit-wrapper");
		wrapper.html(input);
		wrapper.find('.budget-edit-field').focus();
		wrapper.find('.budget-edit-field').blur(function(){
			editBudj($(this));
		});

		return false;
	},

	'keydown .edit-text' : function(event){
		if(event.keyCode == 13){
			editTrans(false, $(event.target));
		}
	},

	'keyup input.money-text-edit' : function(event){
		var val = $(event.target).prop("value");
		if(checkValNum(val) || val == ''){
			$("#edit-error").css('display', 'none');
		}
		else{
			$("#edit-error").css('display', 'block');
		}
	}


}

//Event data for adding a savings goal
Template.savingsGoals.events = {
	'click a#add-savings-goal' : function(event){
		$("#savings-goal-form").slideToggle();
		$(event.target).toggle();
		//return false;
	},

	'click a#new-goal-button' : function(event){
		var descript = $("#savings-descr-input").val();
		var months = $("#savings-month-input").val();
		var value = $("#savings-input").val();

		Meteor.call("addSavingsGoal", value, months, descript, function(error, result){
			if(error) {console.log(error);}
			else if(!result){
				//deliver this better XXX
				alert("this goal is not feasible, please change amount or duration");
			}
			else{
				$("#savings-descr-input").val('');
				$("#savings-month-input").val('');
				$("#savings-input").val('');
				$("#savings-goal-form").slideToggle();
				$("#add-savings-goal").toggle();
			}
		});
	}

}

Template.saveProgress.rendered = function(){
	if(SavingsGoals.find({}).count() > 0){
			var savings = SavingsGoals.find({});

			savings.forEach(function(goal){
				var width = (goal.saved / goal.goal) * 100;
				if (width < 0){
					width = 0;
				}
				else if(width > 100){
					width = 100;
				}
				width = String(parseInt(width)) + "%";
				$("#" + goal._id).find('.save-meter').width(width);
			});
	}
	
}

function getBudjObj(){
	if(Budgets.find({}).count() > 0){
		var budj = Budgets.findOne({});
		var goals = SavingsGoals.find({});

		var budj_obj = {}

		for(var item in budj.cats){
			if(budj.cats.hasOwnProperty(item)){
				budj_obj[item] = budj.cats[item].amount - budj.cats[item].save;
			}
		}
		budj_obj.save = budj.save;
		budj_obj.total = budj.total;
		return budj_obj;
	}
}

function checkExpenses(){
	if(Expenses.find({}).count() > 0){
		var exp = Expenses.findOne({});
		var now = new Date();
		if(exp.date.getMonth() != now.getMonth()){
			console.log(exp.date.getMonth() +  " : " + now.getMonth());
			Meteor.call("createExpenses", function(err){
				if(err) { console.log(err); }
			})
		}

	}
}

function getTransaction(name){
	if(Expenses.find({}).count() > 0){
		var exp = Expenses.findOne({});
		var toReturn = []
		for (var i = exp.spending.length -1 ; i >= 0; i--){
			if(exp.spending[i].cat == name){
				var ob = exp.spending[i];
				ob.id = exp.spending[i].date.getTime();
				ob.date = ob.date.toDateString();
				toReturn.push(ob);
			}
		}

		return toReturn;
	}
}

function getSpending(name){
	if(Expenses.find({}).count() > 0){
		var exp = Expenses.findOne({});
		var budj_obj = getBudjObj();
		var spending = 0.0;

		//sum up all spending with name equal to the one given
		for(var i = 0; i < exp.spending.length; i++){
			if(exp.spending[i].cat === name){
				spending += parseFloat(exp.spending[i].amount);
			}
		}

		var total = budj_obj[name];

		//calculate progress width
		var width = (spending / total) * 100;
		
		//if width > 100 then make text red and progess bar 100%
		if(width > 100)
		{
			width=100;
			$("#"+name+"-row").find('.extra').addClass('spent').removeClass('extra');
		}

		if(width >= 50){
			$("#"+name+"-meter").css('background-color', '#FFB90F');
		}
		
		if(width >= 75){
			$("#"+name+"-meter").css('background-color', '#E3170D');
		}

		//set progress bar width
		width = String(parseInt(width)) + "%";
		$("#"+name+"-meter").width(width);

		//highlight category that has changed
		if(Session.get("lastChanged") == name){
			$("#"+name+"-row").effect("highlight", {color:"#B0B0B0"}, 2000);
		}

		if(Session.get("openRow") == name){
			//figure out best way to keep open rows open, even on refresh until closed
			//XXX
			$("#"+name+"-row").find(".settings-row").show();
		}

		return spending;
	}
	console.log("no expens")
}

function getIndexByTime(spending_list, d_time){
	var index = -1;
	for(var i=0; i<spending_list.length;i++){
		var check_time = spending_list[i].date.getTime();
		if(check_time == d_time){
			index = i;
			break;
		}
	}
	return index;
}

function editTrans(isDelete, $targ){
	var d_time = $targ.closest('tr').attr('id');
	var spending_list = Expenses.findOne({}).spending;
	var ind = getIndexByTime(spending_list, d_time);

	if(!isDelete){
		//update the money value
		if($targ.hasClass("money-text-edit")){
			spending_list[ind].amount = parseFloat($targ.val());
		}
		//update description
		else{
			spending_list[ind].description = $targ.val(); 
		}
	}
	else{
		spending_list.splice(ind, 1);
	}

	var row_id = $targ.parents(".prog-row").attr('id');
	row_id = row_id.substring(0, row_id.length-4);
	Session.set("openRow", row_id);
	Session.set("lastChanged", row_id);
	Session.set("updatedTrans", new Date());

	Meteor.call("updateSpending", spending_list, function(err, result){
		if(err){console.log(err);}
	});

}

function editSave(isDelete, $targ){
	$row = $targ.parents('.save-row');
	if(!isDelete){
		var amount, duration;
		//update the money value
		if($targ.hasClass("money-text-edit")){
			amount = parseFloat($targ.val());
			duration = parseInt($targ.closest(".save-edit").find(".dur-text").text());
		}
		//update description
		else{
			var money = $targ.closest(".save-edit").find('.save-money-text').text();
			amount = parseFloat(money.substring(1, money.length));
			duration = parseInt($targ.val());
		}
		Meteor.call("editGoal", $row.attr('id'), amount, duration, function(err, result){
			if(err){console.log(err);}
			else if(!result){
				console.log("updated goal is not feasible");
			}
		});
	}
	else{
		Meteor.call("deleteGoal", $row.attr('id'), function(err, result){
			if(err){console.log(err);}
		});
	}
	Session.set("openRow", "");
	Session.set("lastChanged", "");
	Session.set("updatedTrans", new Date());
	
	$("#"+$row.attr('id')).effect("highlight", {color:"#B0B0B0"}, 2000);
}

function editBudj($targ){
	var amount = $targ.val();
	var cat = $targ.closest('.prog-row').attr('id');
	cat = cat.substring(0, cat.length-4);

	Meteor.call("editBudget", cat, amount, function(err, result){
		if(err){
			console.log(err);
		}
		else if(!result){
			console.log("goal is not feasible");
		}
	});
	console.log(amount + ": " + cat);

}

function checkValNum(test){
	test.trim();
	return (test.match(/^-?\d*(\.\d+)?$/));
}