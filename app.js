require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const cors = require("cors");
// const multer = require("multer");
var fs = require("fs");
var path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

mongoose.connect(
  "mongodb+srv://12345:12345@cluster0.7icxx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  { useNewUrlParser: false }
);
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number,
  city: String,
  insta: String,
  college: String,
  description: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
const Student = new mongoose.model("Student", studentSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

let alpha = "";
let beta = "";

app.get("/", function (req, res) {
  res.redirect("/login");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/blog");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        beta = req.body.username;
        res.redirect("/home");
      });
    }
  });
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  beta = req.body.username;
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log(beta);
          res.redirect("/userDetails");
        });
      }
    }
  );
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/login");
});

app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    // find all eentrepreneurs
    Student.find({}, (err, items) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred", err);
      }
      res.render("home", { items: items, beta: beta });
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/users", function (req, res) {
  if (req.isAuthenticated()) {
    const newStudent = new Student({
      name: req.body.name,
      email: beta,
      age: req.body.age,
      city: req.body.city,
      insta: req.body.insta,
      college: req.body.college,
      description: req.body.description,
    });

    newStudent.save(function (err) {
      if (err) {
        res.redirect("/login");
      } else {
        res.redirect("/home");
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/userDetails", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("userDetails", {
      beta: beta,
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/user/:userEmail", function (req, res) {
  if (req.isAuthenticated()) {
    Student.findOne({ email: req.params.userEmail }, (err, item) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred", err);
      }
      console.log(item);
      res.render("user", { item: item, beta: beta });
      console.log(item);
    });
  } else {
    res.redirect("/login");
  }
});

app.listen(process.env.PORT || 2000, function () {
  console.log(
    "Express server listening on port %d in %s mode",
    this.address().port,
    app.settings.env
  );
});

app.get("/college", function (req, res) {
  if (req.isAuthenticated()) {
    let college = "";
    Student.find({ email: beta }, (err, items) => {
      if (err) {
        console.log(err);
        res.status(500).send("An error occurred", err);
      }
      college = items[0].college;
    });
  } else {
    res.redirect("/login");
  }
});
