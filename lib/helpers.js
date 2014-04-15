var getBudgetObj = function(budj){
	var budj_obj = {};
	for(var i = 0; i < budj.cats.length; i++){
		budj_obj[budj.cats[i].name] = budj.cats[i].cost; 
	}
	return budj_obj;
}