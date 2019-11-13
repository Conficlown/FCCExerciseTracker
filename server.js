'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const cors = require('cors');

const mongoose = require('mongoose');
try{
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex':true });
} catch(e) {
  console.log(e);
}

var Schema = mongoose.Schema;
var UserSchema = Schema({
  username: {type: String, required: true}
});
var User = mongoose.model('User', UserSchema);

 
var ExerciseSchema = Schema({
  user: {type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         unique: false,
         required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: new Date(Date.now())}
});
var Exercise = mongoose.model('Exercise', ExerciseSchema);


app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Not found middleware
// app.use((req, res, next) => {
//   return next({status: 404, message: 'not found'})
// });

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
});

app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/exercise/new-user', (req, res)=>{
  if(req.body.username!==undefined && req.body.username!==''){
    var user = new User({username: req.body.username});
    user.save((err, doc)=>{
      if(err){console.log(err);}
      res.json(doc);
    })
  }else{
    res.status(400).send("username can't be empty");
  }
});

app.post('/api/exercise/add', (req, res)=>{
  var userId = req.body.userId;
  var desc = req.body.description;
  var duration = Number(req.body.duration);
  var date = new Date(req.body.date);
  if( userId == undefined ){
    res.status(400).send("userId can't be empty");
  }else if( desc === undefined || desc ==='') {
    res.status(400).send("description can't be empty");
  }else if( isNaN(duration) || duration  <= 0){
    res.status(400).send("duration can't be empty or 0");
  }else{
    if(date instanceof Date && !isNaN(date)){
      var exercise = new Exercise({
        user: userId,
        description: desc,
        duration: duration,
        date: date
      });
    }else{
      var exercise = new Exercise({
        user: userId,
        description: desc,
        duration: duration
      });
    }
    exercise.save((err, doc)=>{
      if(err){console.log(err);res.send(err);}
      res.json(doc);
    });
  }
});


app.get('/api/exercise/log', (req, res)=> {
  console.log(req.query);
  var filter = {};
  var option = {};
  if( req.query.hasOwnProperty("userId") ){
      filter["user"]=req.query.userId;
  }else{
    res.status(400).send("userId can't be empty");
  }
  
  filter["date"] = {};
  if( req.query.hasOwnProperty("from") ){
    var fromDate = new Date(req.query.from);
    if(!(fromDate instanceof Date && !isNaN(fromDate))){
      filter["date"]["$gte"]=fromDate;
    }else{
      res.status(400).send("should be from a valid date");
    }
  }
  
  if( req.query.hasOwnProperty("to") ){
    var toDate = new Date(req.query.to);
    if(!(toDate instanceof Date && !isNaN(toDate))){
      filter["date"]["$lte"]=toDate;
    }else{
      res.status(400).send("should be until a valid date");
    }
  }else{
    filter["date"]["$lte"]=new Date();
  }
  
  if( req.query.hasOwnProperty("limit") ){
    var limit = parseInt(req.query.limit);
    if( !isNaN(limit) && limit>0 ){
      option["limit"]=limit;
    }else{
      res.status(400).send("limit should be a valid and positive integer");
    }
  }
  // console.log(filter);
  // console.log(option);
  
  Exercise.find(filter, null, option).populate("user").exec((err, docs)=>{
    if(err){console.log(err);res.send(err);}
    res.json(docs);
  });
});

app.get('/api/exercise/users', (req, res)=>{
  User.find().exec((err, users)=>{
    if(err){console.log(err);res.send(err);}
    if(users.length==0){
      res.send("no users stored");
    }else{
      res.json(users);
    }
  });
}); 

// const nodemailer = require('nodemailer');

// app.get('/api/sendmail', (req, res)=>{
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.GMAILADDRESS,
//       pass: process.env.GMAILPWD
//     }
//   });
//  const mailOptions = {
//     from: 'wwstargazer@gmail.com',
//     to: 'zoeysnowflying1990@gmail.com',
//     subject: 'Sending Email using Node.js',
//     text: 'That was easy!'
//   };

//   transporter.sendMail(mailOptions, function(error, info){
//     if (error) {
//       console.log(error);
//       res.send(error);
//     } else {
//       console.log('Email sent: ' + info.response);
//       res.send('Email sent: ' + info.response);
//     }
//   });
// });



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});