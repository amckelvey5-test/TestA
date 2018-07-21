const express = require("express");
const router = express.Router();
const dateFormat = require("dateformat");

// @route   GET api/ping
// @dsc     Returns generic ping for the server
// @access  Public
router.get("/", (req, res) =>
  res.json({
    pingResult: "Ping is successful!",
    serverTime: dateFormat(Date.now(), "isoDateTime")
  })
);

module.exports = router;
