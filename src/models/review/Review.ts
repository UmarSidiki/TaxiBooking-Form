import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  tripId: string;
  rating: number;
  comment: string;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema({
  bookingId: { 
    type: Schema.Types.ObjectId, 
    ref: "Booking", 
    required: true,
    unique: true  // One review per booking
  },
  tripId: { type: String, required: true },
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  comment: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
}, {
  timestamps: true,
});

// Create indexes for better performance
// Note: bookingId index is already created by unique: true in schema definition
ReviewSchema.index({ tripId: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ rating: 1 });

const Review = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
