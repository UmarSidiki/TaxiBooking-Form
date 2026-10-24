import { Schema, model, models } from "mongoose";

const CalendarFeedSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    role: { type: String, enum: ["admin", "driver", "partner"], required: true },
    token: { type: String, required: true, unique: true },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

const CalendarFeed = models.CalendarFeed || model("CalendarFeed", CalendarFeedSchema);
export default CalendarFeed;
