var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;

var auth = module.exports = function(app) {
  auth.app = app;
  return auth;
}

auth.forceSSL = function(req, res, next) {
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

auth.passport = passport;

passport.serializeUser = function(user, done) {
  done(null, user);
}

passport.deserializeUser = function(userDoc, done) {
  done(null, userDoc);
}

auth.init = function() {
  var app = this.app;
  passport.use(new TwitterStrategy({
    consumerKey: this.app.get('twitter_consumer_key'),
    consumerSecret: this.app.get('twitter_consumer_secret'),
    callbackURL: this.app.get('twitter_callback_url')
  },
  function(token, tokenSecret, profile, done) {
    return done(null, {
      token: token,
      tokenSecret: tokenSecret,
      username: profile.username
    });
  }));
}

auth.addRoutes = function() {
  var app = this.app;

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
}

auth.oauth = function(user) {
  console.log(arguments);
  return {
    consumer_key: this.app.get('twitter_consumer_key'),
    consumer_secret: this.app.get('twitter_consumer_secret'),
    token: user.token,
    token_secret: user.tokenSecret,
    version: "1.0A"
  };
}
