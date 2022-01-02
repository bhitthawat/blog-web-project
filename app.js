//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const request = require("request");
const { isNull } = require("lodash");

const homeStartingContent =
  "สวัสดีครับพี่ๆจากทุกบริษัท ยินดีต้อนรับสู่โปรเจคเว็บ Blog ของผมที่จัดทำขึ้นนะครับ พี่ๆสามารถกดปุ่ม COMPOSE (มุมขวาบน) เพื่อโพสต์ข้อความในเว็บ Blog และสามารถกดปุ่ม Delete เพื่อลบโพสต์ได้ครับ ขอให้สนุกกับโปรเจคของผมครับ ❤";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();
mongoose.connect(
  "mongodb+srv://france2541:077821083@cluster0.rd9j1.mongodb.net/blogDB?retryWrites=true&w=majority"
);

const blog = mongoose.model("blog", { title: String, content: String });

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", function (req, res) {
  blog.find({}, function (err, foundItems) {
    res.render("home", {
      startingContent: homeStartingContent,
      posts: foundItems,
    });
  });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/compose", function (req, res) {
  res.render("compose");
});

app.post("/compose", function (req, res) {
  const post = {
    title: req.body.postTitle,
    content: req.body.postBody,
  };

  const newPost = new blog(post);

  newPost.save(function (err) {
    res.redirect("/");
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

app.post("/", function (req, res) {
  const postDelete = req.body.postDelete;
  console.log(postDelete);

  blog.deleteOne({ startingContent: postDelete }, function (err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);

// app.listen(3000);
