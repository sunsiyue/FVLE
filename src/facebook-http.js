var request = require('request');

var fb_app_id = 1516644165234551;
var fb_app_secret = '8e1f0162e7877281869890a9785620ba';

exports.id = function(token, callback){
	var url = 'https://graph.facebook.com/me';
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body ){
		if(!err && res.statusCode == 200){
			var id = JSON.parse(body).id;
			return callback(false, id);
		} else {
			return callback(true);
		}
	});
}

exports.idAndName = function(token, callback){
	var url = 'https://graph.facebook.com/me';
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body ){
		if(!err && res.statusCode == 200){
			var id = JSON.parse(body).id;
			var name = JSON.parse(body).name;
			return callback(false, id, name);
		} else {
			return callback(true);
		}
	});	
}

exports.getFriends = function(token, callback){
	var url = 'https://graph.facebook.com/me/friends';
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body){
		if(!err && res.statusCode == 200){
			var result = JSON.parse(body).data;
			var name_arr = [];
			var id_arr = [];
			for (var i = 0; i < result.length; ++i) {
				name_arr.push(result[i].name);
				id_arr.push(result[i].id);
			}
			return callback(false, name_arr, id_arr);
		} else {
			return callback(true);
		}
	});	
}

exports.isFriend = function(token, friend_id, callback){
	var url = 'https://graph.facebook.com/me/friends/' + friend_id;
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body){
		if(!err && res.statusCode == 200){
			var bool = (JSON.parse(body).data.length === 1);
			return callback(false, bool);
		} else {
			return callback(true);
		}
	});
}

exports.isSelf = function(token, id, callback){
	var url = 'https://graph.facebook.com/me';
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body ){
		if(!err && res.statusCode == 200){
			var bool = (JSON.parse(body).id === id);
			return callback(false, bool);
		} else {
			return callback(true);
		}
	});
}

exports.hasPermission = function(token, permission, callback){
	var url = 'https://graph.facebook.com/me/permissions/' + permission;
	var options = { uri:url, method: "POST",
		form:{
			access_token: token,
			method: "GET"
		},
	};
	request(options, function(err, res, body){
		if(!err && res.statusCode == 200){
			var bool;
			var bodyJSON = JSON.parse(body);
			if (bodyJSON.data.length === 0){
				bool = false;
			} else if (bodyJSON.data[0].status === 'declined'){
				bool = false;
			} else if (bodyJSON.data[0].status === 'granted'){
				bool = true;
			} else {
				bool = false;
			}
			return callback(false, bool);
		} else {
			return callback(true);
		}
	})
}

exports.publishFirstTimeToFeed = function(token, id, callback){
	exports.hasPermission(token, 'publish_actions',
		function(err, can_publish){
			if (err) throw err;
			if (can_publish){
				var url = 'https://graph.facebook.com/me/feed/';
				var options = { uri:url, method: "POST",
					form:{
						access_token: token,
						method: "POST",
						message: "I've imported my modules into FVLE",
						link: "fvle.jishnumohan.com/profile/" + id,
						picture: "http://fvle.jishnumohan.com/images/logo.jpg",
						caption: "FVLE",
						description: "FVLE is the social sharing site for NUS module " +
							"experiences and resources - because NUS is better with friends"
					},
				};
				request(options, function(err, res, body){
					if(!err && res.statusCode == 200){
						return callback(false);
					} else {
						return callback(true);
					}
				})				
			} else {
				return callback(true);
			}
		})
}

exports.createModuleObject = function(module_code, module_title, callback){
	var url = 'https://graph.facebook.com/app/objects/fvleapp:module';
	var options = {
		uri: url,
		method: "POST",
		form: {
			access_token : fb_app_id + '|' + fb_app_secret,
			method: "POST",
			object: JSON.stringify({
				title: module_code,
				image: "http://fvle.jishnumohan.com/images/logo1024.jpg",
				url: "http://fvle.jishnumohan.com/module/" + module_code,
				description: module_title
			})
		}
	};
	request(options, function(err, res, body){
		if(!err && res.statusCode == 200){
			return callback(false, JSON.parse(body).id);
		} else {
			return callback(true);
		}
	})
}

exports.publishOpenGraphReview = function(fb_token, module_id, callback){
	exports.hasPermission(fb_token, 'publish_actions',
		function(err, can_publish){
			if (err) throw err;
			if (can_publish){
				var url = 'https://graph.facebook.com/me/fvleapp:review'
				var options = {
					uri: url,
					method: "POST",
					form: {
						method: "POST",
						access_token: fb_token,
						module: module_id
					}
				};
				request(options, function(err, res, body){
					if(!err && res.statusCode == 200){
						return callback(false);
					} else {
						return callback(true);
					}
				});
			} else {
				return callback(true);
			}
		})
}

exports.publishOpenGraphTextbook = function(fb_token, module_id, callback){
	exports.hasPermission(fb_token, 'publish_actions',
		function(err, can_publish){
			if (err) throw err;
			if (can_publish){
				var url = 'https://graph.facebook.com/me/fvleapp:sell_textbook_for'
				var options = {
					uri: url,
					method: "POST",
					form: {
						method: "POST",
						access_token: fb_token,
						module: module_id
					}
				};
				request(options, function(err, res, body){
					if(!err && res.statusCode == 200){
						return callback(false);
					} else {
						return callback(true);
					}
				});
			} else {
				return callback(true);
			}
		})
}

exports.publishOpenGraphNote = function(fb_token, module_id, callback){
	exports.hasPermission(fb_token, 'publish_actions',
		function(err, can_publish){
			if (err) throw err;
			if (can_publish){
				var url = 'https://graph.facebook.com/me/fvleapp:share_link_for'
				var options = {
					uri: url,
					method: "POST",
					form: {
						method: "POST",
						access_token: fb_token,
						module: module_id
					}
				};
				request(options, function(err, res, body){
					if(!err && res.statusCode == 200){
						return callback(false);
					} else {
						return callback(true);
					}
				});
			} else {
				return callback(true);
			}
		})
}

//Might be helpful for offline posting - not used currently
exports.longLivedToken = function(short_token, callback){
	var url = 'http://graph.facebook.com/oauth/access_token?' + 
		'grant_type=fb_exchange_token&' +
		'client_id=' + fb_app_id + '&' +
		'client_secret=' + fb_app_secret + '&' +
		'fb_exchange_token=' + short_token;
	var options = { uri: url, json: true};
	request(options, function(err, res, body) {
		if(!err && res.statusCode == 200){
			return callback(false, body)
		} else {
			return callback(true);
		}
	});
}
