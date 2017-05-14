const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.user && req.user.timestamp > 1) {
    res.render('index', { title: 'Admin' })
  } else {
    res.status(403).render('error', {
      error: new Error('403 Forbidden'),
      message: '403 Forbidden.'
    })
  }
})

module.exports = router
