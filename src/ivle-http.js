var request = require('request');

var db = require('./database');
var fb = require('./facebook-http');

var ivle_lapi_key = 'oSl49pydZ6RmEaOd9gP4V';
var this_year = '2014/2015';
var this_sem = '1';
var nusmods_this_year = '2014-2015';
var nusmods_this_sem = 'sem1';

exports.ivlelogin = function(res, callback_url){
	var ivle_login_url = 'https://ivle.nus.edu.sg/api/login/?';
	var ivle_api_arg = 'apikey=';
	var ivle_callback_url_arg = 'url=';
	
	var url = ivle_login_url + ivle_api_arg + ivle_lapi_key
	+ '&' + ivle_callback_url_arg + callback_url;
	res.redirect(url);
}

exports.getModules = function(req, res, ivle_token){
	var ivle_host = 'https://ivle.nus.edu.sg/';
	var ivle_userid_path = 'api/Lapi.svc/UserID_Get?';
	var ivle_api_arg = 'APIKey=';
	var ivle_token_arg = 'Token=';

	var url = ivle_host + ivle_userid_path + ivle_api_arg + ivle_lapi_key
	+ '&' + ivle_token_arg + ivle_token;
	var options = { uri: url, json: true};
	request(options, function(err, ivle_res, body) {
		if(!err && ivle_res.statusCode == 200) {
			var studentID = body;
			getModulesHelper(req, res, ivle_token, studentID);
		}
	});
}

function getModulesHelper(req, res, ivle_token, studentID) {
	var ivle_host = 'https://ivle.nus.edu.sg/';
	var ivle_module_taken_path = '/api/Lapi.svc/Modules_Taken?';
	var ivle_api_arg = 'APIKey=';
	var ivle_token_arg = 'AuthToken=';
	var ivle_id_arg = 'StudentID=';
	
	var url = ivle_host + ivle_module_taken_path + ivle_api_arg + ivle_lapi_key
	+ '&' + ivle_token_arg + ivle_token + '&' + ivle_id_arg + studentID;
	var options = { uri: url, json: true };
	request(options, function(err, ivle_res, body) {
		if(!err && ivle_res.statusCode == 200) { 
			insertModules(req, res, body.Results);
		}
	});
}

function insertModules(req, res, module_json){
	fb.idAndName(req.session.fb_token, function(err, id, name){
		if (err) throw err;
		db.insertUserModules(id, module_json, function(err){
			if (err) throw err;
			db.setIVLEImportToTrue(id, function(err){
				if (err) throw err;
				res.redirect('/profile/' + id);
			});
		});
	});
}

exports.getTimetable = function(req, res, ivle_token) {
	var ivle_host = 'https://ivle.nus.edu.sg/';
	var ivle_module_taken_path = 'api/Lapi.svc/Timetable_Student?';
	var ivle_api_arg = 'APIKey=';
	var ivle_token_arg = 'AuthToken=';
	var ivle_year_arg = 'AcadYear=';
	var ivle_sem_arg = 'Semester=';
	
	var url = ivle_host + ivle_module_taken_path + ivle_api_arg + ivle_lapi_key
	+ '&' + ivle_token_arg + ivle_token + '&' + ivle_year_arg + this_year + '&' + ivle_sem_arg + this_sem;
	var options = { uri: url, json: true };
	request(options, function(err, ivle_res, body) {
		if(!err && ivle_res.statusCode == 200) { 
			insertTimetable(req, res, body.Results);
		}
	});
}

function insertTimetable(req, res, timetable_json){
	fb.idAndName(req.session.fb_token, function(err, id, name){
		if (err) throw err;
		generateNusmodsLink(timetable_json, function(err, timetable_string) {
			if (err) throw err;
			db.insertUserTimetable(id, timetable_string, function(err){
				if (err) throw err;
				db.setIVLEImportTimetableToTrue(id, function(err){
					if (err) throw err;
				});
			});
		});
	});
}

function getLessonType(fullLessonType) {	
	var lessonTypeCode = fullLessonType.substr(0, 3);
	if (fullLessonType === "TUTORIAL TYPE 2") {
		lessonTypeCode="TUT2"; 
	} else if (fullLessonType === "TUTORIAL TYPE 3") {
		lessonTypeCode="TUT3"; 
	} else if (fullLessonType === "DESIGN LECTURE") {
		lessonTypeCode="DLEC"; 
	} else if (fullLessonType === "PACKAGED LECTURE") {
		lessonTypeCode="PLEC"; 
	} else if (fullLessonType === "PACKAGED TUTORIAL") {
		lessonTypeCode="PTUT"; 
	}
	return lessonTypeCode;
}

function generateNusmodsLink(timetable_json, callback) {
	//console.log(timetable_json);
	var lesson = {};
	var result = 'http://nusmods.com/timetable/' + nusmods_this_year + '/' + nusmods_this_sem + '?';
	for (var i = 0; i < timetable_json.length; ++i) {
		if (timetable_json[i].hasOwnProperty('ModuleCode') 
		&& timetable_json[i].hasOwnProperty('LessonType') && timetable_json[i].hasOwnProperty('ClassNo')) {		
			var lessonTypeCode = getLessonType(timetable_json[i].LessonType.toUpperCase());
			var x = timetable_json[i].ModuleCode + lessonTypeCode;
			var y = timetable_json[i].ModuleCode + '[' + lessonTypeCode + ']=' + timetable_json[i].ClassNo + '&';
			lesson[x] = y;
		} else {
			callback(true);
			return;
		}
	}
	for (var key in lesson) {
		result = result.concat(lesson[key]);
	}
	result = result.substr(0, result.length - 1);
	//console.log(result);
	callback(false, result);
}