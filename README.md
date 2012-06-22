# Just Tweet

This is a node example app that simply allows logging in and sending a tweet.

You can try it out on my server. I don't save your oauth token; it is saved in an
encrypted cookie. Or you can run this app yourself.

# Deploying

To deploy, follow these instructions:

## 0. Clone the repo

Clone this repo and change into the directory.

## 1. Create the app

Run `heroku create myappname`. Yes, Heroku did switch to using cedar!

## 2. Register a Twitter app

[Go to twitter's developer page and register an app. Set the callback url to `https://myappname.herokuapp.com/auth/callback`. Yes this is protected with SSL! If you try accessing it without SSL, it will redirect.

## 3. Configure the app

Paste this into a text editor, and change the session secret to something random, and change the twitter credentials and callback to the ones you got from the previous step:

``` bash
heroku config:add \
  NODE_ENV=production \
  SESSION_SECRET=hard_to_guess_session_secret_here \
  TWITTER_CONSUMER_KEY=your_twitter_consumer_key_here \
  TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret_here \
  TWITTER_CALLBACK_URL=https://myappname.herokuapp.com/auth/callback
```

Then run it!

## 4. Push the app

Run `git push heroku master` and watch it deploy!

## 5. Try it out

If everything worked properly, you should be able to go to the site (`heroku open`), sign in, and send a tweet!

# Running locally

Running locally is similar. The configuration file is slightly different.

```
export SESSION_SECRET=hard_to_guess_session_secret_here
export TWITTER_CONSUMER_KEY=your_twitter_consumer_key_here
export TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret_here
export TWITTER_CALLBACK_URL=http://localhost:3000/auth/callback
```

Once you've saved a modified version of this, run these commands:

```
source /path/to/config_file.sh
npm install -g supervisor
supervisor server.js
```

# LICENSE

Public Domain. See http://unlicense.org/ for more information.
