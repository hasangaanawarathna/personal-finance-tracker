const express = require("express");
const router = express.Router();

// GET budget
router.get("/", (req, res) => {
  res.json({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0
  });
});

module.exports = router;