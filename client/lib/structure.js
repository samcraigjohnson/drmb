Template.structure.firstTime = function(){
	return UserData.find({}).count() == 0 || Budgets.find({}).count() == 0;
}