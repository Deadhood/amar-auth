var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('error', {
    message: 'Please login to access the admin page',
    error: {status: 403, stack: '403 Forbidden'}
  })
})

module.exports = router
