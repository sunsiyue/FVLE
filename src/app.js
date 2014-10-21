var express = require('express'),
	ejs = require('ejs'),
	request = require('request'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session'),
	serveStatic = require('serve-static'),
	favicon = require('serve-favicon');    

var app = express();
var port = 3000;

if (app.get('env') === 'development'){
	app.set('host','http://localhost:3000');
}

if (app.get('env') === 'production'){
	app.set('host','http://fvle.jishnumohan.com');
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({secret: '2iueSjsbd92W2WHB'}));

app.use('/css',serveStatic(__dirname + '/css'));
app.use('/js',serveStatic(__dirname + '/js'));
app.use('/images',serveStatic(__dirname + '/images'));
app.use('/fonts',serveStatic(__dirname + '/fonts'));

app.use(favicon(__dirname + '/images/favicon.ico'));

app.set('views',__dirname + '/views');
app.set('view engine',ejs);

var db = require('./database');
var fb = require('./facebook-http');
var ivle = require('./ivle-http');
var nusmods = require('./nusmods-http');
var auth = require('./auth');
var api = require('./api');

var router = express.Router();

router.get('/', function(req,res){
	var redirect_url;
	if(req.query.redirect_url){
		redirect_url = req.query.redirect_url;
	} else {
		redirect_url = '/home';
	}
	if(req.session.logged_in){
		res.redirect(redirect_url);	
	} else {
		res.render('index.ejs', {
			title: 'FVLE',
			redirect_url: redirect_url
		});
	}
});

router.get('/ivlelogin', auth.isAuthenticated, function(req,res){
	ivle.ivlelogin(res, app.get('host') + '/moduleimport');
});

router.get('/moduleimport', auth.isAuthenticated, function(req,res){
	fb.id(req.session.fb_token, function(err, fb_id) {
		if (err) throw err;
		db.hasDoneTimetableImport(fb_id, function(err, has_imported){
			if(err) throw err;
			if (has_imported){
			} else {
				ivle.getTimetable(req, res, req.query.token);
			}
		});
		db.hasDoneIVLEImport(fb_id, function(err, has_imported){
			if(err) throw err;
			if (has_imported){
				res.redirect('/profile/' + fb_id);
			} else {
				ivle.getModules(req, res, req.query.token);
				fb.publishFirstTimeToFeed(req.session.fb_token,
					fb_id,function(err){});
			}
		});
	});
});

router.get('/home', auth.isAuthenticated, auth.hasImported, function(req,res){
	res.render('friends.ejs', {
		title: 'Home | FVLE' 
	});
});

router.get('/ivleimport', auth.isAuthenticated, function(req,res){
	res.render('ivleimport.ejs',{
		title: 'IVLE Import | FVLE'
	});
});

router.get('/login', auth.isAuthenticated, function(req,res){
	var redirect_url;
	if(req.query.redirect_url){
		redirect_url = req.query.redirect_url;
	} else {
		redirect_url = '/home';
	}
	fb.idAndName(req.session.fb_token, function(err, id, name){
		if(err) throw err;
		db.getCount(id, function(err, rows){
			if(err) throw err;
			if (rows[0]['COUNT(fb_id)'] === 0){
				db.insertUser(id, name, function(err, result){
					if (err) throw err;
					res.redirect(redirect_url);
				});
			} else {
				res.redirect(redirect_url);
			}
		});
	});
});

router.post('/logout', function(req,res){
	req.session.logged_in = false;
	res.end();
});

router.get('/profile/:user_id', auth.isAuthenticated, auth.hasImported, function(req,res){
	var id = req.params.user_id;
	var fb_token = req.session.fb_token;
	fb.isSelf(fb_token, id, function(err, is_self){
		if(err) throw err;
		if (is_self){
			db.hasDoneIVLEImport(id, function(err, has_imported){
				if(err) throw err;
				if(has_imported){
					db.getUserModulesFormatted(id, function(err, module_object, sem_count){
						if(err) throw err;
						db.getUserName(id, function(err, name){
							if(err) throw err;
							renderProfilePage(res, id, name, module_object, sem_count, is_self);
						});
					});
				} else {
					res.render('noimport.ejs',{
						title: 'No Import | FVLE',
						fb_id: id
					});							
				}
			});
		} else {
			fb.isFriend(fb_token, id, function(err, is_friend){
				if(err) {
					is_friend = false;
				}
				if(is_friend){
					db.hasDoneIVLEImport(id, function(err, has_imported){
						if(err) throw err;
						if(has_imported){
							db.getUserModulesFormatted(id, function(err, module_object, sem_count){
								if(err) throw err;
								db.getUserName(id, function(err, name){
									if(err) throw err;
									renderProfilePage(res, id, name, module_object, sem_count, is_self);
								});
							});
						} else {
							res.render('noimport.ejs',{
								title: 'No Import | FVLE',
								fb_id: id
							});							
						}
					});					
				} else {
					db.getCount(id, function(err, rows){
						if(err) throw err;
						if (rows[0]['COUNT(fb_id)'] != 0){
							res.render('unauthorized.ejs',{
								title: 'Unauthorized | FVLE'
							});
						} else {
							res.status(404).render('404.ejs',{
								title: 'Page Not Found | FVLE'
							});
						}
					});
				}
			});
		}
	});
});

router.get('/module/:module_code',function(req,res){
	res.render('module.ejs',
		{
			title: req.params.module_code + ' | FVLE',
			module_code: req.params.module_code
		});
})

router.post('/fblogin', function(req,res){
	var fb_token = req.body.fb_token;
	req.session.fb_token = fb_token;
	req.session.logged_in = true;
	res.status(200).send();
});

router.post('/wenbotest',function(req,res){
	var data = req.body.review;
	console.log("data is " + data);
	res.end();
});


//Render helpers
function renderProfilePage(res, fb_id, name, module_object, sem_count, is_self){
	
	var sorted_sems = [];
	var new_obj = {};
	for(sem in module_object){
		if(module_object.hasOwnProperty(sem)){
			sorted_sems.push(sem);			
		}
	}
	sorted_sems.sort().reverse();	
	for(var i=0; i<sorted_sems.length; i++){
		new_obj[sorted_sems[i]] = module_object[sorted_sems[i]];
	}

	res.render('home.ejs', {
		title: name + ' | FVLE',
		value: new_obj,
		sem_count: sem_count,
		name: name,
		fb_id: fb_id,
		is_self: is_self,
	});
}

app.use('/', router);
app.use('/api', api);

app.use(function(req, res){
	// respond with html page
	if (req.accepts('html')) {
		res.status(404).render('404.ejs',{
			title: 'Page Not Found | FVLE'
		});
		return;
	}

	// respond with json
	if (req.accepts('json')) {
		res.status(404).send({ error: 'Not found' });
		return;
	}

	// default to plain-text. send()
	res.status(404).type('txt').send('Not found');
});

var server = app.listen(port, function(){
	console.log('Listening on port %d', server.address().port);
});
