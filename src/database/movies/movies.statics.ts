import { IMovieDocument, IMovieModel, IMovie } from "./movies.types";
import { MovieResponse } from "../../MovieResponse";
import * as Discord from 'discord.js';

export async function findOneOrCreate(
  this: IMovieModel,
  movie: IMovie
): Promise<IMovieDocument> {
    const record = await this.findOne(movie);
    if (record) {
      return record;
    } else {
      return this.create(movie);
    }
}

export async function insertMovie(
  movie: MovieResponse,
  message: Discord.Message
) {
  this.create({
    title: movie.Title,
    genre: movie.Genre.split(', ').map(genre => genre.toLocaleLowerCase()),
    director: movie.Director,
    actors: movie.Actors.split(', '),
    year: parseInt(movie.Year),
    watched: [],
    createDate: Date.now(),
    createUser: message.author.username,
    lastUpdated: Date.now()
  });
}

export async function findByTitleYear(
  this: IMovieModel,
  title: string,
  year: string
): Promise<IMovieDocument> {
  return year ? this.findOne({ title: title, year: parseInt(year)})
    : this.findOne({ title: title });
}
  
export async function findByYearRange(
    this: IMovieModel,
    min?: number,
    max?: number
): Promise<IMovieDocument[]> {
    return this.find({ year: { $gte: min || 0, $lte: max || Infinity } });
}

export async function findByYear(
  this: IMovieModel,
  year: number
): Promise<IMovieDocument[]> {
  return this.find({ year: year });
}

export async function firstXRecords(
  this: IMovieModel,
  X: number
): Promise<IMovieDocument[]> {
  return this.find({}, null, {}).limit(X);
}

export async function findByWatched(
  this: IMovieModel,
  watchedOption: boolean,
  users?: string[] 
): Promise<IMovieDocument[]> {
  if (watchedOption && users) {
    return this.find({ watched: { $exists: true, $not: {$size: 0}, $in: users }}, null, {})
  }  else if (watchedOption) {
    return this.find({ watched: { $exists: true, $not: {$size: 0}}}, null, {})
  } else
    return this.find({ watched: { $exists: true, $size: 0 }}, null, {});
}

export async function findByGenre(
  this: IMovieModel,
  genreName: string 
): Promise<IMovieDocument[]> {
  return this.find({ genre: genreName.toLowerCase() }, null, {});
}

export async function findByPerson(
  this: IMovieModel,
  person: string 
): Promise<IMovieDocument[]> {
  return await this.find({ $text: { $search: person} }, {score: {$meta: "textScore"}})
    .sort({score: { $meta: 'textScore' }});
}