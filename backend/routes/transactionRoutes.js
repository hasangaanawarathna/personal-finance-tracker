const express = require("express");
const router = express.Router();

let transactions = [];

// GET
router.get("/", (req, res) => {
  res.json(transactions);
});

// ADD
router.post("/", (req, res) => {
  const newTx = {
    id: transactions.length + 1,
    title: req.body.title,
    amount: req.body.amount,
    type: req.body.type,
    category: req.body.category,
    date: req.body.date
  };
  transactions.push(newTx);
  res.json(newTx);
});

// DELETE
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  transactions = transactions.filter(t => t.id !== id);
  res.json({ message: "Deleted" });
});

module.exports = router;