//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));


//set up the seesion (has to be place here: create before use it)
app.use(session({
    secret: 'out little secret.',
    resave: false,
    saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());
//************end */


//connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

//fix the error
mongoose.set('useCreateIndex', true);


//create user schema and its model
//this schema is diff than the usual one, it created use the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//replace above two lines with below
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


//Configure Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets", //Authorized redirect URIs
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        //for implement findOrCreate function "npm install mongoose-findorcreate"
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
})



/*********************************OAuth with google *************************************/
//Authenticate Requests
//initiate authentication on google severs ask google for user's profile
app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }));

//once above success, google redirect back to our website to make a get request to '/auth/google/secrets'
//then authenticately user locally
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets page.
        res.redirect('/secrets');
    });
/*********************************OAuth with google *************************************/



app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/secrets", function (req, res) {

    //itrate the secret filed, find the all users that with the filed is not null
    User.find({"secret": {$ne:null}}, function(err, foundUsers) {
        if(err) {
            console.log(err);
        } else {
            if(foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/submit", function(req, res){
    const submitSecret = req.body.secret;

    User.findById(req.user.id,function(err,foundUser){
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                foundUser.secret = submitSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    } );
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/");
})



/******************************locally *************************************/
//post the input on the register page
app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register"); //if error, then we redirect user to the register page again
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

//post the input on the login page
app.post("/login", function (req, res) {
    //create new user; get the input from login page
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});
/******************************locally *************************************/



app.listen(3000, function () {
    console.log("Server started on port 3000.");
})