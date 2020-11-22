import { Schema } from "mongoose";
import { setLastUpdated, sameYear, updateWatched } from "./movies.methods";
import {
  findByYear,
  findOneOrCreate,
  findByTitleYear,
  insertMovie,
  firstXRecords,
  findByWatched,
  findByGenre,
  findByPerson,
  findByYearRange
} from "./movies.statics";

const MovieSchema = new Schema({
  title: String,
  genre: [String],
  director: String,
  actors: [String],
  year: Number,
  watched: [String],
  createDate: {type: Date},
  createUser: String,
  lastUpdated: {
    type: Date,
    default: new Date()
  }
});

MovieSchema.index({director: 'text', actors: 'text'})

MovieSchema.statics.findOneOrCreate = findOneOrCreate;
MovieSchema.statics.findByYear = findByYear;
MovieSchema.statics.findByYearRange = findByYearRange;
MovieSchema.statics.findByTitleYear = findByTitleYear;
MovieSchema.statics.insertMovie = insertMovie;
MovieSchema.statics.firstXRecords = firstXRecords;
MovieSchema.statics.findByWatched = findByWatched;
MovieSchema.statics.findByGenre = findByGenre;
MovieSchema.statics.findByPerson = findByPerson;

MovieSchema.methods.setLastUpdated = setLastUpdated;
MovieSchema.methods.sameYear = sameYear;
MovieSchema.methods.updateWatched = updateWatched;
  
export default MovieSchema;