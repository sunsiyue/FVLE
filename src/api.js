var express = require('express');
var auth = require('./auth');
var fb = require('./facebook-http');
var db = require('./database');
var nusmods = require('./nusmods-http');
var session = require('express-session');
var bodyParser = require('body-parser')

var router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

var status_not_taken = 'not taken';
var status_empty = 'empty';
var status_ok = 'exists';
var status_bad_auth = 'unauthorized';

var status_success = 'success';
var status_no_such_row = 'no row';

router.route('/review/:user_id/:module_code')
.get(auth.isAuthenticatedAPI, function(req,res){
	var id = req.params.user_id;
	var module_code = req.params.module_code;
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			getDetail(res, id, module_code, 'review');
		} else {
			fb.isFriend(req.session.fb_token, id, function(err, is_friend){
				if(err) throw err;
				if(is_friend){
					getDetail(res, id, module_code, 'review');
				} else {
					res.json({status: status_bad_auth});
				}
			});
		}
	});
})
.post(auth.isAuthenticatedAPI, function(req,res){
	var type = req.body.type;
	var text = req.body.text;
	var id = req.params.user_id;
	var module_code = req.params.module_code
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			if(type === 'delete'){
				updateDetail(res, id, module_code, 'review', null);			
			} else {
				updateDetail(res, id, module_code, 'review', text);
				getModuleObjectId(module_code, function(err, module_id){
					fb.publishOpenGraphReview(req.session.fb_token,
						module_id, function(err){});
				});
			}
		} else {
			res.json({status: status_bad_auth});
		}
	});
})

router.route('/textbook/:user_id/:module_code')
.get(auth.isAuthenticatedAPI, function(req,res){
	var id = req.params.user_id;
	var module_code = req.params.module_code;
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			getDetail(res, id, module_code, 'textbook');
		} else {
			fb.isFriend(req.session.fb_token, id, function(err, is_friend){
				if(err) throw err;
				if(is_friend){
					getDetail(res, id, module_code, 'textbook');
				} else {
					res.json({status: status_bad_auth});
				}
			});
		}
	});
})
.post(auth.isAuthenticatedAPI, function(req,res){
	var type = req.body.type;
	var text = req.body.text;
	var id = req.params.user_id;
	var module_code = req.params.module_code
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			if(type === 'delete'){
				updateDetail(res, id, module_code, 'textbook', null);			
			} else {
				updateDetail(res, id, module_code, 'textbook', text);
				getModuleObjectId(module_code, function(err, module_id){
					fb.publishOpenGraphTextbook(req.session.fb_token,
						module_id, function(err){});
				});
			}
		} else {
			res.json({status: status_bad_auth});
		}
	});
})

router.route('/notes_url/:user_id/:module_code')
.get(auth.isAuthenticatedAPI, function(req,res){
	var id = req.params.user_id;
	var module_code = req.params.module_code;
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			getDetail(res, id, module_code, 'note');
		} else {
			fb.isFriend(req.session.fb_token, id, function(err, is_friend){
				if(err) throw err;
				if(is_friend){
					getDetail(res, id, module_code, 'note');
				} else {
					res.json({status: status_bad_auth});
				}
			});
		}
	});
})
.post(auth.isAuthenticatedAPI, function(req,res){
	var type = req.body.type;
	var text = req.body.text;
	var id = req.params.user_id;
	var module_code = req.params.module_code
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			if(type === 'delete'){
				updateDetail(res, id, module_code, 'note', null);			
			} else {
				updateDetail(res, id, module_code, 'note', text);
				getModuleObjectId(module_code, function(err, module_id){
					fb.publishOpenGraphNote(req.session.fb_token,
						module_id, function(err){});
				});
			}
		} else {
			res.json({status: status_bad_auth});
		}
	});
})

router.route('/timetable/:user_id')
.get(auth.isAuthenticatedAPI, function(req,res){
	var id = req.params.user_id;
	var module_code = req.params.module_code;
	fb.isSelf(req.session.fb_token, id, function(err, is_self){
		if(err) throw err;
		if(is_self){
			getTimetableLink(res, id);
		} else {
			fb.isFriend(req.session.fb_token, id, function(err, is_friend){
				if(err) throw err;
				if(is_friend){
					getTimetableLink(res, id);
				} else {
					res.json({status: status_bad_auth});
				}
			});
		}
	});
})

router.route('/take_details/:module_id')
.get(auth.isAuthenticatedAPI, function(req,res){
	db.getFriendsTakenMod(req.session.fb_token,
		req.params.module_id, function(err, result){
			if(err) {
				return res.json({status: status_empty});
			} else {
				return res.json({status: status_success,
					details: result});
			}
		})
})

function getDetail(res, id, module_code, detail){
	db.getSingleTakeDetail(id, module_code, detail, 
	function(err, not_taken, not_reviewed, review){
		if(err) throw err;
		if(not_taken){
			res.json({status: status_not_taken});
		} else if (not_reviewed){
			res.json({status: status_empty});
		} else {
			res.json({
				status: status_ok,
				text: review
			});
		}
	});
}

function updateDetail(res, id, module_code, detail, text){
	db.updateSingleTakeDetail(text, id, module_code, detail, 
	function(err, no_such_row){
		if(err) throw err;
		if(no_such_row){
			res.json({status: status_no_such_row});
		} else {
			res.json({status: status_success});
		}
	});
}

function getTimetableLink(res, id){
	db.getUserTimetable(id, function(err, result){
		if (err) throw err;
		if (result != null){
			res.json({status: status_success, link: result})
		} else {
			res.json({status: status_empty});
		}
	})
}

function getModuleObjectId(module_code, callback){
	db.getModuleOpenGraph(module_code, function(err, absent, id){
		//console.log('Level 1');
		if(err){
			callback(true);
		} else if (absent){
			nusmods.getModuleTitle(module_code,
				function(err, title){
					//console.log('Level 2');
					if(err){
						callback(true);
						return;
					} else {
						fb.createModuleObject(module_code, title,
							function(err, id){
								//console.log('Level 3');
								if(err){
									callback(true);
								} else {
									db.setModuleOpenGraph(module_code,
										id, function(){
											//console.log('Level 4');
											if(err) throw err;
										});
									callback(false, id);
								}
							})
					}
				})
		} else {
			callback(false, id);
		}
	})
}

module.exports = router;