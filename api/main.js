const mongoose = require('mongoose');
const express = require('express');
const app = express();
var cors = require("cors");
var randomstring = require("randomstring");
var bodyParser = require('body-parser');
var RateLimit = require('express-rate-limit');

app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());       
app.use(express.json());

var config = require('./config.js').get(process.env.NODE_ENV);


// app.use(function(req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader('Access-Control-Allow-Methods', '*');
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });


var limiter = new RateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 20, // 30 new posts per minute per IP
  delayMs: 0
});

app.use('/newTitle', limiter);

// TODO dev and prod profiles
mongoose.connect(config.database);
var db = mongoose.connection;

var Title;

db.once('open', function() {
  app.listen(3000, function() {
    console.log('listening on 3000')
  })

  var schema = mongoose.Schema({
  	text: String,
  	hits: Number,
  	id: String
  });

  Title = mongoose.model('Title', schema);

});

app.get('/title', function (request, response) {
  query = {id:request.query.id}
  Title.find(query, function(err, mapping){
    if (err || mapping.length !== 1) {
      // Not found
      response.status(404);
      response.json({error: "Not Found"})
    } else {
      // Update hits count
      Title.update(query, {hits: mapping[0].hits + 1}, function(err, d) {
        if (err) console.error(err);
        response.json({text: mapping[0].text})
      });
    }
  });
})

app.post("/newTitle", function(req, res){
  // Try to find existing id
  var titleStr = req.body.text;
  var findQuery = {text:titleStr};
  Title.find(findQuery, function(err, mapping){
    if (mapping.length == 1) {
      // Done
      res.json({id:mapping[0].id});
    } else {
      // Insert new item
      var id = randomstring.generate(5);

      // Check no conflict
      Title.find({id:id}, function(err, m){
        if (m.length !== 0) {
          res.status(500);
          res.json({error: "ID Conflict"});
        } else {
          // Insert into DB
          var newTitle = new Title({id: id, text: titleStr, hits: 1});
          newTitle.save(function(err, t) {
            if (err) {
              res.status(500);
              res.json({error: "DB insert error"});
            } else {
              res.json({id:id});
            }
          });
        }
      });
    }
  })
});


