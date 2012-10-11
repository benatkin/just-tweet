var express = require('express')
  , cons = require('consolidate');

var app = module.exports = express()
  , auth = require('./auth')(app);

app.engine('html', cons.hogan);
app.set('view engine', 'html');

app.configure(function() {
  app.use(express.logger());
  app.use(express.bodyParser());
});

app.configure('production', function() {
  app.use(auth.forceSSL);
});

auth.config();
auth.init();
auth.initSession();

app.configure(function() {
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function(req, res) {
  var context = { message: req.session.message };
  delete req.session.message;
  if (req.isAuthenticated()) {
    context.username = req.user.username;
    res.render('index', context);
  } else {
    res.render('login', context);
  }
});

app.post('/', function(req, res) {
  auth.consumer.post(
    'http://api.twitter.com/statuses/update.json',
    req.user.token,
    req.user.tokenSecret,
    { status: req.body.status }, // post body
    null, // default content type
    function(err, data, twitter_resp) {
      if (twitter_resp.statusCode === 200) {
        req.session.message = 'Tweet sent!';
      } else if (twitter_resp.statusCode === 401) {
        req.session.message = 'Authentication error. Please sign in again.';
        req.logout();
      } else {
        console.error('Error sending tweet.', twitter_resp);
        req.session.message = 'Unknown error.';
      }
      res.redirect('/');
    }
  );
});

auth.addRoutes();

if (!module.parent) {
  app.set('port', process.env.PORT || 3000);
  app.listen(app.get('port'));
  console.log('Listening on port ' + app.get('port') + '...');
}
