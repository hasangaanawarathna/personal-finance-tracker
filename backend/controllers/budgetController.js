const Budget = require("../models/Budget");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");

// Create budget
const createBudget = async (req, res) => {
  try {
    const { category, limit, month } = req.body;

    if (!category || !limit || !month) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const foundCategory = await Category.findById(category);

    if (!foundCategory) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if (foundCategory.type !== "expense") {
      return res.status(400).json({
        message: "Budget can only be created for expense categories",
      });
    }

    const existingBudget = await Budget.findOne({ category, month });

    if (existingBudget) {
      return res.status(400).json({
        message: "Budget already exists for this category and month",
      });
    }

    const budget = await Budget.create({
      category,
      limit,
      month,
    });

    const populatedBudget = await Budget.findById(budget._id).populate("category");

    res.status(201).json(populatedBudget);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create budget",
      error: error.message,
    });
  }
};

// Get all budgets with spent and remaining
const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find().populate("category").sort({ createdAt: -1 });

    const budgetData = [];

    for (const budget of budgets) {
      const transactions = await Transaction.find({
        category: budget.category._id,
        type: "expense",
      });

      const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const remaining = budget.limit - spent;

      budgetData.push({
        _id: budget._id,
        category: budget.category,
        limit: budget.limit,
        month: budget.month,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        spent,
        remaining,
      });
    }

    const totalBudget = budgetData.reduce((sum, item) => sum + item.limit, 0);
    const totalSpent = budgetData.reduce((sum, item) => sum + item.spent, 0);
    const totalRemaining = totalBudget - totalSpent;

    res.status(200).json({
      totalBudget,
      totalSpent,
      totalRemaining,
      budgets: budgetData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch budgets",
      error: error.message,
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
};