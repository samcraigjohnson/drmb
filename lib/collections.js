Budgets = new Meteor.Collection('budgets');
UserData = new Meteor.Collection('userData');
Expenses = new Meteor.Collection('expenses');
SavingsGoals = new Meteor.Collection('savingsGoals');


/*
	Budgets : {
		user: _id
		total: all the money
		cats: [{ name: "food", cost: 2000}, 
				{trans}, 
				{rent}, 
				{save}, 
				{bills},
				{fun}]
	}
*/
/*Expenses.remove({});
Budgets.remove({});
UserData.remove({});//*
SavingsGoals.remove({});//*/


/*Expenses.insert({
	user: "SpGPXm6i4cTb5wd6E",
	date: new Date(),
	spending: [],
	budj: Budgets.findOne({user: "SpGPXm6i4cTb5wd6E"})._id,
	active: true
});*/


/*Expenses.remove({});/*
Budgets.remove({});
UserData.remove({});/*
Expenses.insert({
	username: "sam",
	date: new Date(),
	spending: {food:10,rent:15,fun:25,gas:50,bills:78}
});*/
//Expenses.update({username:"sam"}, {$set : {spending : {food:0,rent:0,fun:0,trans:0,bills:0}}});
//Expenses.update({username:"sam"}, {$set : {budj: Budgets.findOne({user: Meteor.users.findOne({username:"sam"})._id})}});
//Expenses.update({username:"Allison"}, {$set : {budj: Budgets.findOne({user: Meteor.users.findOne({username:"Allison"})._id})}});
//UserData.remove({});
