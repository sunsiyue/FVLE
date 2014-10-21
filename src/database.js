var mysql = require('mysql');

var pool = mysql.createPool({
	host: 'jishnumohan.com',
	port: 3306,
	user: 'root',
	password: 'Wx08EvB4VqX0BcDYkVBF',
	database: 'fvledb',
	connectionLimit: 10
});

var fb = require('./facebook-http');
var db = require('./database');

exports.getCount = function(fb_id, callback){
	var sql = 'SELECT COUNT(fb_id) FROM user WHERE fb_id = ?;';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, results);
				}
			});
		}
	});
}

exports.getUser = function(fb_id, callback){
	var sql = 'SELECT * FROM user WHERE fb_id = ?;';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, results);
				}
			});
		}
	});
}

exports.getUserName = function(fb_id, callback){
	var sql = 'SELECT name FROM user WHERE fb_id = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, results[0].name);
				}
			});
		}
	});	
}

exports.insertUser = function(fb_id, name, callback){
	var sql = 'INSERT INTO user (fb_id, name) VALUES (?, ?);';
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [fb_id, name], function(err, results) {
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, results);
				}
			});
		}
	});
}

exports.insertUserModules = function(fb_id, module_array, callback){
	var sql = 'INSERT IGNORE INTO take (uid, mid, semester, acadyear) VALUES (?, ?, ?, ?)';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			for (var i=0; i<module_array.length; i++){
				var toInsert = [fb_id, module_array[i].ModuleCode, 
					module_array[i].Semester, module_array[i].AcadYear];
				connection.query(sql, toInsert, function(err, results){
					if(err){
						console.log(err);
						callback(true);
					} 
				});
			}
			connection.release();
			callback(false);
		}
	});
}

exports.insertUserTimetable = function(fb_id, nusmods_link, callback){
	var sql = 'UPDATE user SET timetable = ? WHERE fb_id = ?';
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [nusmods_link, fb_id], function(err) {
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false);
				}
			});
		}
	});
}

exports.getUserModules = function(fb_id, callback){
	var sql = 'SELECT mid, semester,acadyear FROM take WHERE uid = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [fb_id], function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, results);				
				}
			})
		}
	});
}

exports.getUserModulesFormatted = function(fb_id, callback){
	exports.getUserModules(fb_id, function(err, results){
		if(err){
			callback(true);
			return;
		} else {
			var module_history = {};
			var sem_count = 0;
			for (var i=0; i<results.length; i++){
				var unique_semester = results[i].acadyear + ' Semester '
					+ results[i].semester;
				var module_details = {
					code: results[i].mid,
					has_review: (results[i].review != null),
					has_textbook: (results[i].textbook != null),
					has_notes_url: (results[i].note != null)
				}
				if (unique_semester in module_history){
					module_history[unique_semester]
						.push(module_details);
				} else {
					module_history[unique_semester] = 
						[module_details];
					sem_count++;
				}
			}
			callback(false, module_history, sem_count);
		}
	});
}

exports.getUserTimetable = function(fb_id, callback){
	var sql = 'SELECT timetable FROM user WHERE fb_id = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results == null || results.length === 0) {
					callback(false, '');
					return;
				} else {
					callback(false, results[0].timetable);
				}
			})
		}
	})
}

exports.hasDoneIVLEImport = function(fb_id, callback){
	var sql = 'SELECT importdone FROM user WHERE fb_id = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				var bool = false;
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results.length === 0){
					callback(false, bool);
				} else {
					if(parseInt(results[0].importdone)){
						bool = true;
					}
					callback(false, bool);
				}
			});
		}
	});
}

exports.hasDoneTimetableImport = function(fb_id, callback){
	var sql = 'SELECT import_timetable FROM user WHERE fb_id = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id],function(err, results){
				connection.release();
				var bool = false;
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results.length === 0){
					callback(false, bool);
				} else {
					if(parseInt(results[0].import_timetable)){
						bool = true;
					}
					callback(false, bool);
				}
			});
		}
	});
}

exports.setIVLEImportToTrue = function(fb_id, callback){
	var sql = 'UPDATE user SET importdone = ? WHERE fb_id = ?';
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [true, fb_id], function(err) {
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false);
				}
			});
		}
	});
}

exports.setIVLEImportTimetableToTrue = function(fb_id, callback){
	var sql = 'UPDATE user SET import_timetable = ? WHERE fb_id = ?';
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [true, fb_id], function(err) {
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false);
				}
			});
		}
	});
}

exports.getSingleTakeDetail = function(fb_id, module_code, detail, callback){
	var sql = getSQLString(detail, true);
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id, module_code],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results.length === 0){
					callback(false, true);
				} else {
					if(!(results[0][detail])){
						callback(false, false, true)
					} else {
						callback(false, false, false, results[0][detail]);
					}
				}
			});
		}
	});
}

exports.updateSingleTakeDetail = function(text, fb_id, module_code, detail, callback){
	var sql = getSQLString(detail, false);
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[text, fb_id, module_code],
				function(err, result){
					connection.release();
					if(err){
						console.log(err);
						callback(true);
						return;
					} else if (result.changedRows === 0){
						callback(false, true);
					} else {
						callback(false, false);
					}
				});
		}
	});
}

function getSQLString(detail, is_get){
	//Preventing SQL Injection!
	if(is_get){
		if (detail === 'review'){
			return 'SELECT review FROM take WHERE uid = ? AND mid = ?'
		} else if (detail === 'textbook'){
			return 'SELECT textbook FROM take WHERE uid = ? AND mid = ?';
		} else if (detail === 'note'){
			return 'SELECT note FROM take WHERE uid = ? AND mid = ?'
		} else {
			return;
		}
	} else {
		if (detail === 'review'){
			return 'UPDATE take SET review = ? WHERE uid = ? AND mid = ?';
		} else if (detail === 'textbook'){
			return 'UPDATE take SET textbook = ? WHERE uid = ? AND mid = ?';
		} else if (detail === 'note'){
			return 'UPDATE take SET note = ? WHERE uid = ? AND mid = ?';
		} else {
			return;
		}
	}
}


//Following functions are used but may come in handy if we change implementation

exports.getAllTakeDetails = function(fb_id, module_code, callback){
	var sql = 'SELECT review,note,textbook FROM take WHERE uid = ? AND mid = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[fb_id, module_code],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results.length === 0){
					callback(false, true);
					return;
				} else {
					var result_object = {
						'review': [false],
						'noteURL': [false],
						'textbook': [false]
					}
					if(results[0].review){
						result_object.review[0] = true;
						result_object.review.push(results[0].review)
					}
					if(results[0].note){
						result_object.noteURL[0] = true;
						result_object.noteURL.push(results[0].note)
					}
					if(results[0].textbook){
						result_object.textbook[0] = true;
						result_object.textbook.push(results[0].textbook)
					}
					callback(false, false, result_object);
				}
			});
		}
	});
}

exports.updateAllTakeDetails = function(review_text, notes_url, textbook, fb_id, module_code, callback){
		var sql = 'UPDATE take SET (review,note,textbook)' + 
		' VALUES (?,?,?) WHERE uid = ? AND mid = ?';
		pool.getConnection(function(err, connection){
			if(err){
				console.log(err);
				callback(true);
				return;
			} else {
				connection.query(sql,
					[review_text, notes_url, textbook, fb_id, module_code],
					function(err, result){
						connection.release();
						if(err){
							console.log(err);
							callback(true);
							return;
						} else if (result.changedRows === 0){
							callback(false, true);
						} else {
							callback(false, false);
						}
					});
			}
		});
}

exports.getPeopleTakenMod = function(moduleCode, callback){
	var sql = 'SELECT uid, acadyear, semester, note, review, textbook FROM take WHERE mid = ?;';
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql, [moduleCode], function(err, result) {
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else {
					callback(false, result);
				}
			});
		}
	});
}

// how to call: 
// db.getFriendsTakenMod(fb_token, 'CS3216', function(err, result) {
// 	console.log(result);
// });
exports.getFriendsTakenMod = function(fb_token, moduleCode, callback) {
	var ret = [];
	fb.getFriends(fb_token, function(err, name_arr, id_arr) {
		if (err) {callback(true); return;};
		db.getPeopleTakenMod(moduleCode, function(err, result) {
			if (err) {callback(true); return;};
			for (var i = 0; i < result.length; ++i) {
				var pos = id_arr.indexOf(result[i].uid);
				if (pos != -1) {
					ret.push(result[i]);
					ret[ret.length - 1]['name'] = name_arr[pos];
				}
			}
			callback(false, ret);
		});
	});
}

exports.getModuleOpenGraph = function(module_code, callback){
	var sql = 'SELECT fb_id from module_opengraph WHERE code = ?';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[module_code],function(err, results){
				connection.release();
				if(err){
					console.log(err);
					callback(true);
					return;
				} else if (results.length === 0){
					callback(false, true);
				} else {
					callback(false, false, results[0].fb_id);
				}
			});
		}
	});
}

exports.setModuleOpenGraph = function(module_code, fb_id, callback){
	var sql = 'INSERT INTO module_opengraph (code, fb_id) VALUES (?,?)';
	pool.getConnection(function(err, connection){
		if(err){
			console.log(err);
			callback(true);
			return;
		} else {
			connection.query(sql,[module_code, fb_id],
				function(err, result){
					connection.release();
					if(err){
						console.log(err);
						callback(true);
						return;
					} else {
						callback(false);
					}
				});
		}
	});
}