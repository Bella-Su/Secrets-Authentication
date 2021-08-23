//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser =  require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(express.urlencoded({
    extended: true
}));

//connect to mongodb
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

//create user schema and its model
//this schema is diff than the usual one, it created use the mongoose schema class
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
})

app.get("/login", function(req, res){
    res.render("login");
})

app.get("/register", function(req, res){
    res.render("register");
})

//post the input on the register page
app.post("/register", function(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser = new User({
            email: req.body.username,
            password: hash
        })
    
        newUser.save(function(err){
            if(err) {
                console.log(err);
            } else {
                res.render("secrets"); //see the sercets page if user registered
            }
        });
    });

    
});

//post the input on the login page
app.post("/login", function(req, res){
    
    const username = req.body.username;
    const password = req.body.password;

    //understand the two parameters in the callback function
    User.findOne({email:username}, function(err, foundUser){
        if(err) {
            console.log(err);
        } else {
            if(foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(result === true) {
                        res.render("secrets"); //see the secerts page if user login
                    }
                });   
            }
        }
    });
});


app.listen(3000, function() {
    console.log("Server started on port 3000.");
})