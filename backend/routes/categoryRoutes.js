const express = require("express");
const router = express.Router();

let categories = [
  { id: 1, name: "Salary", type: "Income" },
  { id: 2, name: "Food", type: "Expense" }
];

// GET all categories
router.get("/", (req, res) => {
  res.json(categories);
});

// ADD category
router.post("/", (req, res) => {
  const newCategory = {
    id: categories.length + 1,
    name: req.body.name,
    type: req.body.type
  };
  categories.push(newCategory);
  res.json(newCategory);
});

// DELETE category
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  categories = categories.filter(c => c.id !== id);
  res.json({ message: "Deleted" });
});

module.exports = router;