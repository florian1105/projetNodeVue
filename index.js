const PORT = process.env.PORT || 5000 // this is very important
const bodyParser = require('body-parser')
const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const axios = require('axios')
const cors = require('cors');
const secret = 'thisismysecret'
const jSonParser = bodyParser.json()
const app = express()
const bcrypt = require('bcrypt')
const saltRounds = 10;
app.use(cors())

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
  const user = ax.get(`/members?q={email:${payload.email}`);

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

//all articles for one author
app.get('/articles/:id', (req, res) => {
  const id = req.params.id;
  ax.get(`/articles?q={"auteur.email":"${id}"}`).then(function (response) {
    // handle success
    res.json(response.data)
  });
});

app.get('/article/auteur/:id', (req,res) => {
  const id = req.params.id;
  ax.get(`/members?q={"email":"${id}"}`,jSonParser).then(function (response) {
    res.json(response.data)

  })
});


//all commentaires for one article
app.get('/commentaires/:idArticle', (req, res) => {
  const id = req.params.id;
  ax.get(`/commentaires?q={"article":"${id}"}`).then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//add article
app.post('/article/add', jSonParser,passport.authenticate('jwt', { session: false }), async(req, res) => {
  const article = req.body;
  console.log(article)
  ax.post('/articles',article).then(function (response) {
    // handle success
    res.json(response.data);
  });
});

//modify article
app.post('/article/modify/:id', jSonParser,passport.authenticate('jwt', { session: false }),async(req, res) => {
  const id = req.params.id;
  const article = req.body;
  console.log(article);
  const articleModif = await ax.put(`/articles/${id}`, {
    nom: article.nom,
    contenu: article.contenu,
    auteur: article.auteur,
  });
    // handle success
   await res.json(articleModif.data);
});

//one article specified by an id
app.get('/article/:id', async(req, res) => {
  const id = req.params.id;
  const article = await ax.get(`/articles?q={"id":${id}}`);
  await res.json(article.data);
});


//delete one article specified by an id
app.get('/article/delete/:id',passport.authenticate('jwt', { session: false }), async(req, res) => {
  const id = req.params.id;
  const article = await ax.delete(`/articles/*?q={"id":${id}}`);
  await res.json(article.data);
});

app.post('/login', jSonParser, async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    res.status(401).json({ error: 'Email or password was not provided.' })
    return
  }

  // usually this would be a database call:
  var user = await ax.get(`/members?q={"email":"${email}"}`);
  user=user.data[0]
  if (bcrypt.compare(password, user.password, function(err, result) {
    return result
  })){
    res.status(401).json({ error: 'Email / password do not match.' })
    return
  }

  const userJwt = jwt.sign({ user: user.email }, secret)

  res.json({ jwt: userJwt })
})

app.post('/register',jSonParser , async (req,res) =>{
  const member = req.body
  bcrypt.hash(member.password, saltRounds, function(err, hash) {
    const encMember = {
      'username':member.username,
      'email':member.email,
      'password':hash
    };
    ax.post('/members',encMember).then(function (response) {
      // handle success
      res.json(response.data);
    });
  });

});


app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT)
})

