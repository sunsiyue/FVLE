var session = require('express-session');
var db = require('./database');
var fb = require('./facebook-http');

exports.isAuthenticated = function(req, res, next){
	if(req.session.logged_in){
		return next();
	} else {
		res.redirect('/?redirect_url=' + req.path);
	}
}

exports.isAuthenticatedAPI = function(req, res, next){
	if(req.session.logged_in){
		return next();
	} else {
		res.json({status: 'unauthorized'});
	}
}

exports.hasImported = function(req, res, next){
	fb.id(req.session.fb_token, function(err, fb_id){
		if(err) throw err;
		db.hasDoneIVLEImport(fb_id, function(err, has_imported){
			if(err) throw err;
			if (has_imported){
				db.hasDoneTimetableImport(fb_id, function(err, has_imported_timetable){
					if(err) throw err;
					if (has_imported_timetable){
						next();
					} else {
						res.redirect('/ivleimport');
					}
				});
			} else {
				res.redirect('/ivleimport');
			}
		});
	});
}