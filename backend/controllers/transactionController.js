const Transaction = require("../models/Transaction");
const Category = require("../models/Category");

// Create transaction
const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;

    if (!title || !amount || !type || !category || !date) {
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

    if (foundCategory.type !== type) {
      return res.status(400).json({
        message: "Transaction type and category type must match",
      });
    }

    const transaction = await Transaction.create({
      title: title.trim(),
      amount,
      type,
      category,
      date,
    });

    const populatedTransaction = await Transaction.findById(transaction._id).populate("category");

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("category")
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  deleteTransaction,
};