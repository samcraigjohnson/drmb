Meteor.methods({

	//num_checks, pay, rent, utils, age, location)
	//start game with question
	saveBudget: function (moneyObj){
		moneyObj.user = Meteor.userId();
		UserData.insert(moneyObj);
		var budj = {};
		var budget = compute_budget(moneyObj, budj);
		budget.user = Meteor.userId();
		Budgets.insert(budget, function(error, id){
			if(!error){
				make_expense(id, Meteor.userId());
			}
			else{
				console.log(error);
			}
		});
	},
	updateBudget: function(ud){
		UserData.update({user: Meteor.userId()}, ud);
		var old_budj = Budgets.findOne({user: this.userId});
		var new_budj = compute_budget(ud, old_budj);
		Budgets.update({user: this.userId}, new_budj, function(error, id){
			if(!error){
				calculate_budget(Meteor.userId());
			}
			else{
				console.log(error);
			}
		});
		
	},

	addExpense : function(amt, category, descr){
		var d = descr || " ";
		console.log(d);
		var spend_obj = { 
				amount: amt, 
				cat: category, 
				date: new Date(),
				dateString: moment().format(),
				description: d
			};
		console.log(spend_obj.date);
		Expenses.update({user: this.userId, active: true}, {$push : {spending: spend_obj}});
	},

	createExpenses: function(){
		var budj = Budgets.findOne({user: Meteor.userId()});
		make_expense(budj._id, Meteor.userId());
	},

	updateSpending: function(new_list){
		Expenses.update({user: this.userId, active:true}, {$set: {spending: new_list}});
	},

	addSavingsGoal : function(amount, duration, descr){
		if(is_feasible(amount, duration)){
			var goal = SavingsGoals.insert({
				user: this.userId,
				active: true,
				goal: amount,
				months: duration,
				description: descr,
				completed: false,
				saved: 0,
				date: new Date()
			});
			add_goal(goal);
			return true;
		}
		return false;		
	},

	editGoal : function(id, amount, duration){
		if(is_feasible(amount, duration)){
			SavingsGoals.update({_id: id}, {$set: {goal: amount, months: duration}});
			calculate_budget(this.userId);
			return true;
		}
		return false;
	},
	deleteGoal : function(id){
		SavingsGoals.remove({_id:id});
		calculate_budget(this.userId);
	},

	editBudget: function(cat, amount){
		var budj = Budgets.findOne({user: this.userId});
		var curr_display = budj.cats[cat].amount - budj.cats[cat].save;
		var diff = curr_display - parseFloat(amount);
		distribute(budj, diff, cat, this.userId);
	}
});

function add_goal(g_id){
	 Budgets.update({user: Meteor.userId()}, {$push: {goals: g_id}});
	 calculate_budget(Meteor.userId());
}

function is_feasible(amount, duration){
	var save_per_month = Math.ceil(parseFloat(amount)/parseFloat(duration));
	var budj = Budgets.findOne({user: Meteor.userId()});
	var curr_save = budj.save + save_per_month;
	var expendable = get_expendable(budj);
	
	if(curr_save > expendable){
		return false;
	}
	return true;
}

/*
	This method is used to distribute surplus/deficit cash
	into the budget
*/
function distribute(budj, amount, cat, userId){
	//is a deficit 
	if(amount < 0){
		var exp = get_expendable(budj);
		//check to see if viable change
		if(amount > exp){
			return exp;
		}
	}
	//is a surplus
	else{
		var div = budj.num_cats;
		if(cat != ""){
			div -= 1;
		}

		var num_per_cat = amount/div;
		//distribute the new surplus
		for(item in budj.cats){
			if(budj.cats.hasOwnProperty(item) && item != cat){
				//XXX to figure out budj.cats.amount += 
			}
		}
	}
}

/*
	This method is used to change the budget around with
	anything regarding the savings goals. It looks at all
	the goals and determines how much to save, then distributes
	it equally over the different categories (where they
	have room to change)
*/
function calculate_budget(userId){
	var budj = Budgets.findOne({user: userId});
	var to_save = 0;
	var to_remove = -1;
	console.log("budget: " + budj, "user: " + userId);
	//determine how much to save each month
	var now = moment();
	for(var i=0; i<budj.goals.length; i++){
		var goal = SavingsGoals.findOne({_id: budj.goals[i]});


		
		if(goal == undefined){
			to_remove = i;
		}
		else if(!goal.completed){
			var gm_date = moment(goal.date);
			var months_left = goal.months - gm_date.diff(now, 'months');
			to_save += Math.ceil(parseFloat(goal.goal - goal.saved)/parseFloat(months_left));
		}
	}

	//if there is a dead reference to an old goal, remove it
	if(to_remove >= 0){
		budj.goals.splice(to_remove, 1);
	}

	//if there is the ability to save as much as needed this month
	//then determine save values for individual categories
	if(to_save <= get_expendable(budj)){
		var turns = 0;
		var left = to_save;
		budj = reset_save(budj);
		//while there is money left to distribute
		//turns is a safeguard against unforeseen infinite loop
		while(left > 0 && turns < 5){
			turns += 1;
			var count = budj.num_cats;
			for(var item in budj.cats){
				if(budj.cats.hasOwnProperty(item)){
					var amount_per_cat = Math.ceil(parseFloat(left)/count);
					var flex = getFlex(budj.cats[item]);

					if(flex > amount_per_cat){
						budj.cats[item].save += amount_per_cat;
						left -= amount_per_cat;
					}
					else if(flex > 0){
						budj.cats[item].save += flex;
						left -= flex;
					}
					count -= 1;
				}
			}
		}
		budj.save = to_save;
		console.log("calculated new budget in " + turns + " turns");
		Budgets.update({user: Meteor.userId()}, budj);
	}
	//the amount to save is not feasible, need to adjust goals (length or amount)
	else{
		//XXX determine the amount that needs to change, and/or the length that needs to change
		console.log("the budget has become unfeasible: " + to_save + ", expendable: " + get_expendable(budj));
	}
}

/*Set all the save values in the budget to zero,
  this happens every time the budget needs to be
  recalculated*/
function reset_save(budj){
	for(var item in budj.cats){
		budj.cats[item].save = 0;
	}
	return budj;
}

/* Get the total amount of flex in the budget.
	Used to determine if budget changes are feasible*/
function get_expendable(budj){
	var expendable = 0;
	for(var item in budj.cats){
		if(budj.cats.hasOwnProperty(item)){
			var flex = getFlex(budj.cats[item]);
			expendable += flex;
		}
	}
	return expendable;
}

/* Create a new expense object.
	Also, determine if a savings goal has been
	completed and calculate the surplus for the month */
function make_expense(id, userId){
	//add money to savings goals
	if(Expenses.find({user: userId, active:true}).count() > 0){
		var exp = Expenses.findOne({user: userId, active: true});
		var budj = Budgets.findOne({user: userId});

		var spent = 0;
		for (var i = 0; i < exp.spending.length; i++){
			spent += exp.spending[i].amount;
		}
		
		//add money to savings goals if surplus
		//XXX add notification here!!!!
		if(budj.total > spent){
			var goals = SavingsGoals.find({user: userId, active: true});
			var surplus = budj.total - spent;
			var count = goals.count();
			
			//for every active savings goal, distribute surplus money
			goals.forEach(function (goal){
				var surplus_per_goal = parseFloat(surplus)/parseFloat(count);
				surplus_per_goal = surplus_per_goal.toFixed(2);
				var money_saved = 0;

				if(!goal.completed){
					goal.saved += parseFloat(surplus_per_goal);
					money_saved += parseFloat(surplus_per_goal);
					
					//if the goal has been completed
					if(goal.saved >= goal.goal){
						var diff = goal.saved - goal.goal;
						money_saved -= diff; //subtract extra money
						goal.saved = goal.goal;
						goal.completed = true;
						//XXX add notification here
					}
					SavingsGoals.update({_id: goal._id}, goal);
				}

				count -= 1;
				surplus -= money_saved;
			});

			//if surplus even after goal money distributed
			if(surplus > 0){
				//XXX notification & roll over to next month budget
			}
		}

		calculate_budget(userId); 
	}

	Expenses.update({user: userId}, {$set: {active: false}}, {multi: true});
	//XXX ADD ADJUSTMENT OF BUDGET BASED ON SPENDING/SAVING
	var exps = Expenses.insert({
		user: userId,
		date: new Date(),
		spending: [],
		budj: id,
		active: true
	});
}

/* Used to create a budget. This will use the set
	of guidelines based on data to create initial
	budgets */
function compute_budget(money, budj){
	budj.total = money.checks * money.make;
	budj.save = 0;
	budj.num_cats = 5;

	budj.cats = {};
	budj.cats.food = compute_food_obj(budj.total);
	budj.cats.trans = compute_trans_obj(budj.total);
	budj.cats.bills = {amount: parseFloat(money.utils), floor: parseFloat(money.utils), save: 0};
	budj.cats.rent = {amount: parseFloat(money.rent), floor: parseFloat(money.rent), save: 0};
	
	var left = budj.total;
	for(var name in budj.cats){
		if(budj.cats.hasOwnProperty(name)){
			left -= budj.cats[name].amount;
		}
	}

	//if leftover money put in fun fund!
	budj.cats.fun = {amount: 0, floor: 0, save:0};
	if(left > 0){
		budj.cats.fun.amount = left;
	}

	//log budj object
	console.log(budj);
	return budj;
}

function compute_food_obj(total){
	var obj = {};
	obj.amount = parseInt(total * .128);
	obj.floor = 0;
	obj.save = 0;
	return obj;
}

function compute_trans_obj(total){
	var obj = {};
	obj.amount = parseInt(total * .175);
	obj.floor = 0;
	obj.save = 0;
	return obj;
}

function compute_save_obj(total){
	var obj = {};
	obj.amount = parseInt(total * 0);
	obj.floor = 0;
	obj.save = 0;
	return obj;
}


Meteor.publish("budget", function(){
	return Budgets.find({user: this.userId});
});

Meteor.publish("userData", function(){
	return UserData.find({user: this.userId});
});

Meteor.publish("savingsGoals", function(){
	return SavingsGoals.find({user: this.userId, active:true});
});

Meteor.publish("spending", function(){
	return Expenses.find({user: this.userId, active:true});
	
});
