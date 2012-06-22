var express = require('express')
  , cons = require('consolidate')
  , yummy = require('yummy')
  , oauth = require('oauth');

var app = module.exports = express()
  , auth = require('./auth')(app)
  , passport = auth.passport;

[
  'session_secret',
  'twitter_consumer_key',
  'twitter_consumer_secret',
  'twitter_callback_url'
].forEach(function(confvar) {
  var envvar = confvar.toUpperCase();
  app.set(confvar, process.env[envvar]);
  if (!app.get(confvar)) {
    throw new Error('Environment variable not specified: ' + envvar);
  }
});

app.engine('html', cons.hogan);
app.set('view engine', 'html');

app.configure(function() {
  app.use(express.logger());
});

app.configure('production', function() {
  app.use(auth.forceSSL);
});

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(yummy({secret: app.get('session_secret')}));
});

auth.init();

app.configure(function() {
  app.use(passport.initialize());
  app.use(passport.session());
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
  var consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token",
    "https://twitter.com/oauth/access_token", 
    app.get('twitter_consumer_key'),
    app.get('twitter_consumer_secret'),
    "1.0A",
    "http://localhost:3000/auth/callback",
    "HMAC-SHA1"
  );
  consumer.post(
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
