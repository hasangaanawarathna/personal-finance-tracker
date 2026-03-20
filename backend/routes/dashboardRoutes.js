const express = require("express");
const router = express.Router();

let transactions = []; // later DB use කරනවා

router.get("/", (req, res) => {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === "Income") income += t.amount;
    else expense += t.amount;
  });

  res.json({
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense
  });
});

module.exports = router;