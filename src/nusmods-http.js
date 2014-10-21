var request = require('request');

var this_year = '2014-2015/';
var nusmods_api_host = 'http://api.nusmods.com/';

// nusmods.getModuleInfo('CS3216', 1, function(err, result) {
// 	if (err) return;
// 	console.log(result);
// });
exports.getModuleInfo = function(moduleCode, semester, callback) {
	var query = "modules/";
	var url = nusmods_api_host + this_year + semester + '/' + query + moduleCode + ".json";
	console.log(url);

	var options = { uri: url, json: true};
	request(options, function(err, ivle_res, body) {
		if(!err && (ivle_res.statusCode == 200)) {
			callback(false, body);
			return;
		} else {
			callback(true);
		}
	});
}

exports.getModuleTitle = function(moduleCode, callback) {
	var url = nusmods_api_host + this_year + '/modules/' +
				moduleCode + '/index.json';
	var options = {uri: url, json: true};
	request(options, function(err, res, body){
		if(!err && (res.statusCode == 200)) {
			callback(false, body.ModuleTitle);
			return;
		} else {
			callback(true);
		}
	})
}