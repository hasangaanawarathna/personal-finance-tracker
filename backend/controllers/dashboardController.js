const Transaction = require("../models/Transaction");

const getDashboardData = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("category")
      .sort({ date: -1, createdAt: -1 });

    const totalIncome = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpense = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const balance = totalIncome - totalExpense;

    const recentTransactions = transactions.slice(0, 5);

    res.status(200).json({
      totalIncome,
      totalExpense,
      balance,
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardData,
};