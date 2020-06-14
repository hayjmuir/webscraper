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

app.get("/", function(req, res) {
    axios.get("https://movieweb.com/superheroes/").then(function(response) {
        var $ = cheerio.load(response.data);
        $("article").each(function(i, element) {
          var result = {};
          result.title = $(this)
            .find("h3")
            .children("a")
            .text();
          result.link = $(this)
            .children("a")
            .attr("href");
          result.summary = $(this)
            .find("p")
            .text()
            .trim();
    
          // Create a new Article using the `result` object built from scraping
          db.Article.create(result)
            .then(function(dbArticle) {
              console.log(dbArticle);
            })
            .catch(function(err) {
              console.log(err);
            });
        });
      });
    });

    // Send a message to the client
    // res.send("Scrape Complete");



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

});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  db.Article.create(req.body)
  .then(function(dbArticle) {

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

});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
