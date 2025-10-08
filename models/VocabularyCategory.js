const mongoose = require("mongoose");

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "unknown"];

const VocabularyCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String },
    level: { type: String, enum: LEVELS, default: "unknown" },
    color: { type: String, default: "#2563eb" },
    icon: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VocabularyCategory",
    },
    metadata: {
      deckTypes: [{ type: String }],
      tags: [{ type: String }],
    },
  },
  { timestamps: true }
);

VocabularyCategorySchema.index({ slug: 1 }, { unique: true });
VocabularyCategorySchema.index({ isActive: 1, order: 1 });
VocabularyCategorySchema.index({ parent: 1, order: 1 });

module.exports =
  mongoose.models.VocabularyCategory ||
  mongoose.model("VocabularyCategory", VocabularyCategorySchema);
