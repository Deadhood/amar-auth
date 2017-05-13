var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var r = require('rethinkdb')
require('rethinkdb-init')(r)
var sha1 = require('sha1')
var rconn

var index = require('./routes/index')
var users = require('./routes/users')

var app = express()

r.init({
  host: 'localhost',
  port: 28015,
  db: 'mydb'}, [
    {
      name: 'users',
      indexes: ['username']
    }
  ]
).then(function (conn) {
  r.conn = conn
  rconn = conn
  r.conn.use('mydb')
})

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
passport.use(new LocalStrategy(
  function (username, password, done) {
    r
      .table('users').filter(r.row('username').eq(username))
      .run(rconn, function (err, cur) {
        if (err) {
          return done(err)
        }
        cur.each(function (err, res) {
          if (err) {
            return done(err)
          }
          if (res.password !== sha1(password)) {
            return done(null, false, { message: 'Incorrect username.' })
          }
          return done(null, res)
        })
      })
  }
))
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
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
