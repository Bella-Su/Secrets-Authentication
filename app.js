//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser =  require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose");



const app = express();

console.log(process.env.API_KEY);

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
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

//fix the error
mongoose.set('useCreateIndex', true);

//create user schema and its model
//this schema is diff than the usual one, it created use the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", function(req, res){
    res.render("home");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get("/register", function(req, res){
    res.render("register");
})

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
    req.logOut();
    res.redirect("/");
})

//post the input on the register page
app.post("/register", function(req, res) {

    User.register({username:req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect("/register"); //if error, then we redirect user to the register page again
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
    
});

//post the input on the login page
app.post("/login", function(req, res){
    //create new user; get the input from login page
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});


app.listen(3000, function() {
    console.log("Server started on port 3000.");
})