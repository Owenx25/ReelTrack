import { model } from "mongoose";
import { IMovieDocument, IMovieModel } from "./movies.types";
import MovieSchema from "./movies.schema";

export const MovieModel = model<IMovieDocument>("Movie", MovieSchema) as IMovieModel;