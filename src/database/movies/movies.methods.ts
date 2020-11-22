import { Document } from "mongoose";
import { IMovieDocument } from "./movies.types";

export async function setLastUpdated(this: IMovieDocument): Promise<void> {
  const now = new Date();
    if (!this.lastUpdated || this.lastUpdated < now) {
    this.lastUpdated = now;
    await this.save();
  }
}

export async function sameYear(this: IMovieDocument): Promise<Document[]> {
  return this.model("Movie").find({ year: this.year });
}

export async function updateWatched(this: IMovieDocument, user: string): Promise<Document> {
  const newWatched = [...this.watched, user];
  return this.model("Movie").updateOne(this, { $set: {watched: newWatched}});
}