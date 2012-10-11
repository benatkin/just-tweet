var express = require('express')
  , app = module.exports = express()
  , cons = require('consolidate')
  , passport = require('passport')
  , url = require('url')
  , TwitterStrategy = require('passport-twitter').Strategy
  , yummy = require('yummy')
  , oauth = require('oauth');

// Check config

[
  'SESSION_SECRET',
  'TWITTER_CONSUMER_KEY',
  'TWITTER_CONSUMER_SECRET',
  'TWITTER_CALLBACK_URL'
].forEach(function(envvar) {
  if (! process.env[envvar]) {
    throw new Error('Environment variable not specified: ' + envvar);
  }
});

// Set up passport

passport.serializeUser = function(user, done) {
  done(null, user);
}

passport.deserializeUser = function(userDoc, done) {
  done(null, userDoc);
}

function verifyToken(token, tokenSecret, profile, done) {
  return done(null, {
    token: token,
    tokenSecret: tokenSecret,
    username: profile.username
  });
}

var twitterStrategySettings = {
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL
};

var twitterStrategy = new TwitterStrategy(twitterStrategySettings, verifyToken);

passport.use(twitterStrategy);

var consumer = new oauth.OAuth(
  "https://twitter.com/oauth/request_token",
  "https://twitter.com/oauth/access_token", 
  process.env.TWITTER_CONSUMER_KEY,
  process.env.TWITTER_CONSUMER_SECRET,
  "1.0A",
  "http://localhost:3000/auth/callback",
  "HMAC-SHA1"
);

function forceSSL(req, res, next) {
  if (req.header('x-forwarded-proto') === 'https') {
    next();
  } else {
    var urlObj = {
      protocol: 'https:',
      hostname: req.header('host'),
      pathname: req.url
    }
    res.redirect(url.format(urlObj));
  }
}

// Set up Express
// --------------

app.engine('html', cons.hogan);
app.set('view engine', 'html');

app.use(express.logger());
app.use(express.bodyParser());

app.configure('production', function() {
  app.use(auth.forceSSL);
});

app.use(express.cookieParser());
app.use(yummy({secret: process.env.SESSION_SECRET}));
app.use(passport.initialize());
app.use(passport.session());

app.configure(function() {
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Set up routes
// -------------

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
  consumer.post(
    'https://api.twitter.com/1.1/statuses/update.json',
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
        console.error('Error sending tweet.', twitter_resp.statusCode, twitter_resp.headers, data);
        req.session.message = 'Unknown error.';
      }
      res.redirect('/');
    }
  );
});

app.get('/auth', passport.authenticate('twitter'));

app.get('/auth/callback', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    req.session.oauth_verifier = req.query.oauth_verifier;
    req.session.oauth_token = req.query.oauth_token;
    res.redirect('/');
  });

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Start Server
// ------------

function startServer() {
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log('Listening on port ' + port + '...');
  });
}

if (!module.parent) {
  startServer();
}
