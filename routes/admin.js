const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.user.id.length > 10) {
    res.render('index', { title: 'Admin' })
  } else {
    res.end()
  }
})

module.exports = router
