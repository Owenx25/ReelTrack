import { Document, Model } from "mongoose";
import { MovieResponse } from "../../MovieResponse";
import * as Discord from 'discord.js';

export interface IMovie {
  title: String,
  genre: String[],
  director: String,
  actors: String[],
  year: Number,
  watched: String[],
  createDate: Date,
  createUser: String,
  lastUpdated: Date
}

export interface IMovieDocument extends IMovie, Document {
  setLastUpdated: (this: IMovieDocument) => Promise<void>;
  sameYear: (this: IMovieDocument) => Promise<Document[]>;
  updateWatched: (this: IMovieDocument, user: string) => Promise<Document>;
}

export interface IMovieModel extends Model<IMovieDocument> {
  findOneOrCreate: (this: IMovieModel, movie: IMovie) => Promise<IMovieDocument>;
  firstXRecords: (this: IMovieModel, X: number) => Promise<IMovieDocument[]>;

  findByTitleYear: (this: IMovieModel, title: string, year: string) => Promise<IMovieDocument>;
  findByYearRange: (this: IMovieModel, min?: number, max?: number) => Promise<IMovieDocument[]>;
  findByYear: (this: IMovieModel, year: number) => Promise<IMovieDocument[]>;
  findByWatched: (this: IMovieModel, watchedOption: boolean, users?: string[]) => Promise<IMovieDocument[]>;
  findByGenre: (this: IMovieModel, genreName: string) => Promise<IMovieDocument[]>;
  findByPerson: (this: IMovieModel, person: string) => Promise<IMovieDocument[]>;

  insertMovie: (this: IMovieModel, movie: MovieResponse, message: Discord.Message) => void;
}
