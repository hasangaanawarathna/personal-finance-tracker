const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    limit: {
      type: Number,
      required: [true, "Budget limit is required"],
      min: [0, "Budget limit must be greater than or equal to 0"],
    },
    month: {
      type: String,
      required: [true, "Month is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Budget", budgetSchema);