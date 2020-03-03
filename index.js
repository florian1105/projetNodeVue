const PORT = process.env.PORT || 5000 // this is very important
const bodyParser = require('body-parser')
const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const axios = require('axios')
const secret = 'thisismysecret'
const urlEncodedParser = bodyParser.urlencoded({ extended: false })
const app = express()
const users = [];
var request = require("request");

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy


const ax = axios.create({
  baseURL:'https://projetnodevue-02a4.restdb.io/rest',
  headers : {
    'Content-Type' : 'application/json',
    'x-apikey' : '160d0237f1c259c83d43af8dd935687f035cb',
    'cache-control': 'no-cache',
  }

})



const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secret
}

const jwtStrategy = new JwtStrategy(jwtOptions, function(payload, next) {
  // usually this would be a database call:
  const user = users.find(user => user.email === payload.user)

  if (user) {
    next(null, user)
  } else {
    next(null, false)
  }
})

passport.use(jwtStrategy)


app.get('/', function (req, res) {
  res.send('Hello World!')
});

//all articles
app.get('/articles', (req, res) => {
  ax.get('/articles').then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//all commentaires for one article
app.get('/commentaires/:idArticle', (req, res) => {
  var id = req.params.id;
  ax.get(`/commentaires?q={"article":"${id}"}`).then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//add article
app.get('/article/add', async(req, res) => {
  ax.get('/articles').then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//modify article
app.get('/article/modify/:id', (req, res) => {
  ax.get('/articles').then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//one article specified by an id
app.get('/article/:id', async(req, res) => {
	var id = req.params.id;
  	var article = await ax.get(`/articles?ID=${id}`);
  	res.json(article.data);
});


//one article specified by an id
app.get('/article/delete/:id', async(req, res) => {
	var id = req.params.id;
  	var article = await ax.delete(`/articles/*?q={"id":${id}}`);
  	res.json(article.data);
});

// //delete one article specified by an id
// app.get('/article/delete/:id', async (req, res) => {
// 	var id = req.params.id;
// 	var options = { method: 'DELETE',
//   		url: `https://projetnodevue-02a4.restdb.io/rest/articles/*?q={"id":${id}}`,
// 		  headers: 
// 		   { 'cache-control': 'no-cache',
// 		     'x-apikey': '160d0237f1c259c83d43af8dd935687f035cb',
// 		     'content-type': 'application/json' } 
// 		 };

// request(options, function (error, response, body) {
//   if (error) throw new Error(error);

//   console.log(body);
// });
// });

app.get('/private', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.send('Hello ' + req.user.email)
})

app.post('/login', urlEncodedParser, async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    res.status(401).json({ error: 'Email or password was not provided.' })
    return
  }

  // usually this would be a database call:
  var user = await ax.get(`/members?q={"email":"${email}"}`);
  user=user.data[0];
  if (user.password !== password) {
    res.status(401).json({ error: 'Email / password do not match.' })
    return
  }

  const userJwt = jwt.sign({ user: user.email }, secret)

  res.json({ jwt: userJwt })
})


app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT)
})

