let categories = [
  { id: 1, name: "Salary", type: "Income" },
  { id: 2, name: "Food", type: "Expense" }
];

// GET
exports.getCategories = (req, res) => {
  res.json(categories);
};

// POST
exports.addCategory = (req, res) => {
  const newCategory = {
    id: categories.length + 1,
    name: req.body.name,
    type: req.body.type
  };
  categories.push(newCategory);
  res.json(newCategory);
};

// DELETE
exports.deleteCategory = (req, res) => {
  const id = parseInt(req.params.id);
  categories = categories.filter(c => c.id !== id);
  res.json({ message: "Deleted" });
};