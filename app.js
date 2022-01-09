//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require("request");
const { isNull } = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

const homeStartingContent =
  "สวัสดีครับพี่ๆจากทุกบริษัท ยินดีต้อนรับสู่โปรเจคเว็บ Blog ของผมที่จัดทำขึ้นนะครับ พี่ๆสามารถกดปุ่ม COMPOSE (มุมขวาบน) เพื่อโพสต์ข้อความในเว็บ Blog และสามารถกดปุ่ม Delete เพื่อลบโพสต์ได้ครับ ขอให้สนุกกับโปรเจคของผมครับ ❤";

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "Our little Secret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://france2541:077821083@cluster0.rd9j1.mongodb.net/blogv2?retryWrites=true&w=majority"
);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

const blog = new mongoose.model("blog", {
  title: String,
  content: String,
  authorID: String,
  authorUsername: String,
});

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  request(
    {
      method: "POST",
      uri: "https://notify-api.line.me/api/notify",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        bearer: "tCTzhJ91NOYoKA0C9x2jsW4HdYU5EFOdxWob6vKeR79",
      },
      form: {
        message: "\nขณะนี้มีผู้คนเข้ามาชมเว็บไซต์ของคุณ",
      },
    },
    (err, httpResponse, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log(body);
      }
    }
  );

  if (req.isAuthenticated()) {
    res.redirect("/blog");
  } else {
    res.render("home");
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/blog");
        });
      }
    }
  );
});

app.get("/login", function (req, res) {
  if (req.isAuthenticated()) {
    res.redirect("/blog");
  } else {
    res.render("login");
  }
});

app.post("/login", function (req, res, next) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    // Redirect if it fails
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      // Redirect if it succeeds
      return res.redirect("/blog");
    });
  })(req, res, next);
});

app.get("/blog", function (req, res) {
  if (req.isAuthenticated()) {
    blog.find({}, function (err, foundpost) {
      res.render("blog", {
        startingContent: homeStartingContent,
        posts: foundpost,
        username: req.user.username,
      });
    });

    app.get("/compose", function (req, res) {
      res.render("compose");
    });

    app.post("/compose", function (req, res) {
      const post = {
        title: req.body.postTitle,
        content: req.body.postBody,
        authorID: req.user.id,
        authorUsername: req.user.username,
      };

      const newPost = new blog(post);

      newPost.save(function () {
        res.redirect("/blog");
      });

      request(
        {
          method: "POST",
          uri: "https://notify-api.line.me/api/notify",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          auth: {
            bearer: "tCTzhJ91NOYoKA0C9x2jsW4HdYU5EFOdxWob6vKeR79",
          },
          form: {
            message:
              "\nชื่อโพสต์: " + post.title + "\n" + "เนื้อหา: " + post.content,
          },
        },
        (err, httpResponse, body) => {
          if (err) {
            console.log(err);
          } else {
            console.log(body);
          }
        }
      );
    });

    app.post("/", function (req, res) {
      var deleteTitle = req.body.postDelete;

      blog.findOne({ title: deleteTitle }, function (err, foundpost) {
        console.log(foundpost);
        console.log(req.user.id);
        if (foundpost.authorID === req.user.id) {
          blog.deleteOne({ title: deleteTitle }, function () {
            res.redirect("/blog");
          });
        } else {
          res.redirect("/blog");
        }
      });
    });

    app.get("/posts/:postName", function (req, res) {
      const requestedTitle = _.lowerCase(req.params.postName);

      blog.find({}, function (err, foundItems) {
        foundItems.forEach(function (post) {
          const storedTitle = _.lowerCase(post.title);

          if (storedTitle === requestedTitle) {
            res.render("post", {
              title: post.title,
              content: post.content,
            });
          }
        });
      });
    });

    app.get("/logout", function (req, res) {
      req.logout();
      res.redirect("/");
    });
  } else {
    res.redirect("/login");
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
