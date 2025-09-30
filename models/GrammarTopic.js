const mongoose = require("mongoose");

const GrammarTopicSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    level: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", "mixed"],
      default: "mixed",
    },
    tags: [{ type: String }],
    sections: [
      {
        key: { type: String, required: true },
        title: { type: String, required: true },
        order: { type: Number, default: 0 },
        content: { type: String },
        examples: [{ type: String }],
      },
    ],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GrammarTopic || mongoose.model("GrammarTopic", GrammarTopicSchema);