var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/scraperdb";
mongoose.connect(MONGODB_URI);

// Routes

app.get("/scrape", function(req, res) {
  axios.get("http://www.nytimes.com/").then(function(error,response,html) {
    var $ = cheerio.load(html);
    var result = {};
    $("div.story-body").each(function(i, element) {
        var link = $(element).find("a").attr("href");
        var title = $(element).find("h2.headline").text().trim();
        var summary = $(element).find("p.summary").text().trim();
        var img = $(element).parent().find("figure.media").find("img").attr("src");
        result.link = link;
        result.title = title;
        if (summary) {
            result.summary = summary;
        };
        if (img) {
            result.img = img;
        }
        else {
            result.img = $(element).find(".wide-thumb").find("img").attr("src");
        };
        var entry = new Article(result);
        Article.find({title: result.title}, function(err, data) {
            if (data.length === 0) {
                entry.save(function(err, data) {
                    if (err) throw err;
                });
            }
        });
    });
    console.log("Scrape finished.");
    res.redirect("/");
    });

    // Send a message to the client
    res.send("Scrape Complete");
  });


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}).then(function(dbArticle){
    res.json(dbArticle)
  }).catch(function(err){
    res.json(err)
  })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
 db.Article.findOne({}).populate("note").then(function(dbArticle){
   res.json(dbArticle)
 }).catch(function(err){
   res.json(err)
 })
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  db.Article.create(req.body)
  .then(function(dbArticle) {
    // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
    // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
    // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    return db.User.findOneAndUpdate({}, { $push: { notes: dbNote._id } }, { new: true });
  })
  .then(function(dbArticle) {
    // If the User was updated successfully, send it back to the client
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurs, send it back to the client
    res.json(err);
  });
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
