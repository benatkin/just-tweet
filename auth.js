var express = require('express')
  , passport = require('passport')
  , url = require('url')
  , TwitterStrategy = require('passport-twitter').Strategy
  , yummy = require('yummy')
  , oauth = require('oauth');

var app;

var auth = module.exports = function(_app) {
  app = _app;
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

auth.config = function() {
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
}

auth.init = function() {
  passport.use(new TwitterStrategy({
    consumerKey: app.get('twitter_consumer_key'),
    consumerSecret: app.get('twitter_consumer_secret'),
    callbackURL: app.get('twitter_callback_url')
  },
  function(token, tokenSecret, profile, done) {
    return done(null, {
      token: token,
      tokenSecret: tokenSecret,
      username: profile.username
    });
  }));

  this.consumer = new oauth.OAuth(
    "https://twitter.com/oauth/request_token",
    "https://twitter.com/oauth/access_token", 
    app.get('twitter_consumer_key'),
    app.get('twitter_consumer_secret'),
    "1.0A",
    "http://localhost:3000/auth/callback",
    "HMAC-SHA1"
  );
}

auth.initSession = function() {
  app.use(express.cookieParser());
  app.use(yummy({secret: app.get('session_secret')}));
  app.use(passport.initialize());
  app.use(passport.session());
}

auth.addRoutes = function() {
  app.get('/auth', passport.authenticate('twitter'));

  // TODO: provide middleware that renders login page if not logged in
  // TODO: provide copy/paste setup page when auth isn't configured

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
