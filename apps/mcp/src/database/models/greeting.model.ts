import mongoose, { Document, Schema } from "mongoose";

export interface GreetingSchemaType extends Document {
  greeting: string;
  embedding?: number[];
}

export type GreetingType = Partial<
  mongoose.InferSchemaType<typeof greetingSchema>
> &
  Partial<{
    user_id: string;
    category: string;
    created_at: string;
  }>;

const greetingSchema: Schema<GreetingSchemaType> = new Schema({
  greeting: {
    type: String,
    required: true,
  },
  embedding: { type: [Number] },
});

export const GreetingModel =
  (mongoose.models.GreetingModel as mongoose.Model<GreetingSchemaType>) ||
  mongoose.model<GreetingSchemaType>("GreetingModel", greetingSchema);
