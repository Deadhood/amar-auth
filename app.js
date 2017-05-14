const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const r = require('rethinkdb')
require('rethinkdb-init')(r)
let connection
const sha256 = () => require('crypto').createHash('sha256')

const index = require('./routes/index')
const users = require('./routes/users')
const admin = require('./routes/admin')
const login = require('./routes/login')

const app = express()

r.init({
  host: 'localhost',
  port: 28015,
  db: 'mydb'}, [
    {
      name: 'users',
      primaryKey: 'username'
    }
  ]
).then(function (conn) {
  connection = conn
  r.conn = conn
  r.conn.use('mydb')
})

passport.serializeUser((user, done) => done(null, user.username))

passport.deserializeUser(
  (username, done) => r
    .table('users')
    .get(username)
    .run(connection)
    .then(user => done(null, user))
)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', index)
app.use('/users', users)
app.use('/admin', admin)
app.use('/login', login)
passport.use(new LocalStrategy(
  function (username, password, done) {
    r
    .table('users').filter(r.row('username').eq(username))
    .run(connection, function (err, cur) {
      if (err) {
        return done(err)
      }
      cur.each(function (err, res) {
        if (err) {
          return done(null, false, { message: 'Incorrect Username.' })
        }
        if (res.password !== sha256().update(password, 'utf8').digest('hex')) {
          return done(null, false, { message: 'Incorrect Password.' })
        }
        return done(null, res)
      })
    })
  }
))

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/admin',
    failureRedirect: '/login',
    failureFlash: false
  })
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
