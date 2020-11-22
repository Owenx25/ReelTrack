require('dotenv').config()

import * as Discord from 'discord.js';
import fetch, { Response } from 'node-fetch';
import { MovieResponse } from './MovieResponse';
import { connect } from './database/database';
import { IMovieDocument } from './database/movies/movies.types';

// Create Client
const client = new Discord.Client();

// Login to server
client.login(process.env.TOKEN);

// Connect to MongoDB
const db = connect();


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  const command = parseCommand(msg.content);
  if (command) {
    handleOperation(command, msg);
  }
});

export const parseCommand = (message: string): string[] => {
  // Validate bot command
  if (!message.startsWith('::')) {
    return;
  }

  // Parse args
  // A year can be included if comma spaced after the title, ex: Suspiria, 1977
  const commandRegex = /::(\w*)\s?([\w\s\+\-]*)?,?\s?((?:\w+|,\s?)*)?/g;
  const matches = commandRegex.exec(message);
  return matches.slice(1);
}

export const handleOperation = (command: string[], msg: Discord.Message): void => {
  switch (command[0]) {
    case 'lookup':
      processLookupCommand(command[1], command[2])
      .then(response => msg.channel.send(buildMovieEmbed(response)))
      .catch(err => msg.channel.send('Error: ' + err));
      break;
    case 'add': 
      processAddCommand(command[1], command[2], msg)
      .then(response => { 
        if(response) {
          msg.channel.send(response)
        }
      })
      .catch(err => sendError(err, msg));
      break;
    case 'remove': 
      processRemoveCommand(command[1], command[2])
      .then(response => msg.channel.send(response))
      .catch(err => sendError(err, msg));
      break;
    case 'watched': 
      processWatchedCommand(command[1], command[2], msg)
      .then(response => msg.channel.send(response))
      .catch(err => sendError(err, msg));
      break;
    case 'list':
      processListCommand(command[1], command[2], msg)
      .then(response => msg.channel.send(response))
      .catch(err => sendError(err, msg));
      break;
    case 'random':
      processRandomCommand()
      .catch(err => sendError(err, msg));
      break;
    default:
      sendError('invalid command. Valid commands: lookup, add, delete, watched, random', msg)
    return;
  }
}

const sendError = (error: string, msg: Discord.Message) => {
  if (error && msg) {
    msg.channel.send('🤯  Error: ' + error);
  }
}

export const processLookupCommand = async (title: string, year: string): Promise<MovieResponse> => {
  return await fetchMovieData(title, year); 
}

export const processAddCommand = async (title: string, year: string, message: Discord.Message): Promise<string> => {
  const movie = await fetchMovieData(title, year);
  const existingMovie = await db.MovieModel.findByTitleYear(movie.Title, movie.Year);
  if (existingMovie) {
    const createDate = existingMovie.lastUpdated.toISOString().split('T')[0];
    return `🤖  Movie is already on the list! ${existingMovie.title} was added on ${createDate} by ${existingMovie.createUser}  🤖`;
  }

  // Confirm that the movie fetched was the one they want
  const lookup = await message.channel.send(buildMovieEmbed(movie));
  const confirmation = await message.channel.send(message.author.toString() + ' React here with  👍  to add this movie, or  👎  to cancel.');

  const filter = (reaction: Discord.MessageReaction , user: Discord.User) => 
    ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;

  // User gets 2 minutes to react to the message
  return confirmation.awaitReactions(filter, { time: 120000, errors: ['time'], max: 1 })
    .then(collected => {
      const reaction = collected.first(); 
      lookup.delete();
      confirmation.delete();
      if (reaction.emoji.name === '👍') {
        db.MovieModel.insertMovie(movie, message);
        return `🍿 ${movie.Title} was added to the list! 🍿`;
      }
    })
    .catch(collected => {
      lookup.delete();
      confirmation.delete();
      return `🤖  ${message.author.toString()} add for ${movie.Title} has timed out. No movie was added.  🤖`;
    });
}

export const processRemoveCommand = async (title: string, year: string): Promise<string> => {
  const existingMovie = await db.MovieModel.findByTitleYear(title, year);
  if (!existingMovie) {
    throw 'Movie not found!';
  }
  await db.MovieModel.deleteOne(existingMovie);
  return `🤖  ${existingMovie.title} was removed from the list.  🤖`;
}

export const processWatchedCommand = async (title: string, year: string, message: Discord.Message): Promise<string> => {
  const existingMovie = await db.MovieModel.findByTitleYear(title, year);
  if (!existingMovie) {
    throw 'Movie not found!';
  }

  // Update watched with user
  existingMovie.updateWatched(message.author.username);
  return `🤖  ${existingMovie.title}(${existingMovie.year}) has been marked as watched by ${message.author.username}!  🤖`;
}

export const processListCommand = async (subCommands: string, additionalArgs: string, message: Discord.Message): Promise<Discord.MessageEmbed> => {
  // Parse sub commands:
  // list [number] => list the first [number] movies, there is an upper and lower limit.
  // list [substring] => list the first 100 movies whose title match the substring
  // list unwatched [user?] => list movies that haven't been watched by the command user
  // list watched [user?] => list movies that have been watched by the command user
  // list genre [genre] => list movies that have the genre
  // list person [person] => list movies that have the director or actors
  // list year [year] [number?] => list the first 50? movies that have the year
  // list addedBy [user] [number?] => list movies that were added by the user

  if (!subCommands) {
    // list last 100 movies added to list
    return movieListToEmbed(await db.MovieModel.firstXRecords(100));
  }
  const subCommandArgs = subCommands.split(' ');
  const firstArg = parseInt(subCommands[0]);

  if (!isNaN(firstArg)) {
    return movieListToEmbed(await db.MovieModel.firstXRecords(firstArg));
  }

  switch (subCommandArgs[0]) {
    case 'unwatched':
      // First name will always be in 2nd arg ex ['list', 'watched Owen', 'Wilson, Garrison']
      let unwatchUsers = mergeUserArgs(subCommandArgs[1], additionalArgs);
      return movieListToEmbed(await db.MovieModel.findByWatched(false, unwatchUsers), "Unwatched Movies");
    case 'watched':
      let watchUsers = mergeUserArgs(subCommandArgs[1], additionalArgs);
      return movieListToEmbed(await db.MovieModel.findByWatched(true, watchUsers), "Watched Movies");
    case 'genre':
      // I'm limiting genre to one string for now. Maybe in the future I can parse for multiple
      validateArgExists(subCommandArgs[1], "No genre provided!")
      return movieListToEmbed(await db.MovieModel.findByGenre(subCommandArgs[1]), `${subCommandArgs[1]} Movies`);
    case 'person':
      validateArgExists(subCommandArgs[1], "No person provided!")
      return movieListToEmbed(await db.MovieModel.findByPerson(subCommandArgs[1]), `Movies with ${subCommandArgs[1]}`);
    case 'year':
      // '+' or '-' after year indicates all movies before or after that year. 'year-year' is all movies in that span. (both ends are inclusive)
      validateArgExists(subCommandArgs[1], "No year/s provided!")
      return isYearRange(subCommandArgs[1]) ? handleYearRange(subCommandArgs[1]) :
        movieListToEmbed(await db.MovieModel.findByYear(+subCommandArgs[1]), `Movies from ${subCommandArgs[1]}`)
    case 'addedBy':
      // 
      validateArgExists(subCommandArgs[1], "No username provided!")
      return 
      break;
    default:
      throw 'invalid list command. Valid list commands are unwatched, watched, genre, person, year, addedBy';
  }
}

const mergeUserArgs = (firstUser: string, additionalUsers: string): string[] => {
  let users = firstUser ? [firstUser] : undefined;
  if (additionalUsers) {
    let userArr = additionalUsers.split(',').map(user => user.trim());
    users = [...users, ...userArr];
  }
  return users;
}

const isYearRange = (commandArg: string): boolean => {
  const commandRegex = /\d{4}-\d{4}|\d{4}\+|\d{4}\-/g;
  const matches = commandRegex.exec(commandArg);
  return matches != undefined;
}

const handleYearRange = async (rangeStr: string): Promise<Discord.MessageEmbed> => {
  if (isIncreasingRange(rangeStr)) {
    const year = cutoffRangeSymbol(rangeStr);
    return movieListToEmbed(await db.MovieModel.findByYearRange(year), `Movies from ${year} on`);
  } else if (isDecreasingRange(rangeStr)) {
    const year = cutoffRangeSymbol(rangeStr);
    return movieListToEmbed(await db.MovieModel.findByYearRange(0, year), `Movies from before ${year}`);
  }
  const years = extractFullRange(rangeStr)
  return movieListToEmbed(await db.MovieModel.findByYearRange(years[0], years[1]), `Movies from ${years[0]} to ${years[1]}`);
}

const isIncreasingRange = (rangeStr: string): boolean => {
  const commandRegex = /\d{4}\+/g;
  const matches = commandRegex.exec(rangeStr);
  return matches != undefined;
}

const isDecreasingRange = (rangeStr: string): boolean => {
  const commandRegex = /\d{4}\-$/g;
  const matches = commandRegex.exec(rangeStr);
  return matches != undefined;
}

const extractFullRange = (rangeStr: string): number[] => {
  const commandRegex = /(\d{4})-(\d{4})/g;
  const matches = commandRegex.exec(rangeStr);
  if (matches.length === 3) {
    return [+matches[1], +matches[2]];
  }
  throw "Unable to parse range string"
}

const cutoffRangeSymbol = (range: string): number => {
  return +range.slice(0, -1)
}

export const validateArgExists = (arg: string, errMessage: string): boolean => {
  if (arg){
    return true;
  } else {
    throw errMessage;
  }
}

export const movieListToEmbed = async (movies: IMovieDocument[], listTitle?: string): Promise<Discord.MessageEmbed> => {
    if (movies.length > 0) {
      const movieStrings = stringifyMovieList(movies);
      return buildMovieListEmbed(listTitle || "Movie List", movieStrings);
    }
  throw "No movies in your list yet!";
}

export const stringifyMovieList = (movieList: IMovieDocument[]): string => {
  let listString = "";
  movieList.forEach(movie => {
    listString += `${movie.title} (${movie.year})\n`; 
  });
  return listString;
} 


export const processRandomCommand = (): Promise<string> => {
  return Promise.resolve("stub");
}

export const fetchMovieData = async (title: string, year: string): Promise<MovieResponse> => {
  if (!title) {
    throw "No title provided.";
  }

  let fetchUrl: string = `http://www.omdbapi.com/?apikey=${process.env.OMDB_KEY}&t=${title}`;
  if (year) {
    fetchUrl += `&y=${year}`;
  }

  try {
    const response: Response = await fetch(fetchUrl, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' }
    });

    const movie = await response.json();
    // Error has content if the response was bad
    if (movie.Error) {
      throw movie.Error;
    }
    return movie;
  } catch (err) {
    throw err;
  }
}

export const buildMovieEmbed = (movie: MovieResponse): Discord.MessageEmbed => {
  const movieEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle(movie.Title)
  .setDescription(movie.Plot)
  .setThumbnail("https://cdn0.iconfinder.com/data/icons/social-media-2219/50/61-512.png")
  .addFields(
    { name: 'Runtime', value: movie.Runtime, inline: true },
    { name: 'Director', value: movie.Director, inline: true },
    { name: 'Actors', value: movie.Actors },
    { name: 'Genre', value: movie.Genre },
    { name: 'Year Released', value: movie.Year, inline: true },
  )
  .setImage(movie.Poster)
  .setTimestamp();
  return movieEmbed;
}

export const buildMovieListEmbed = (title: string, movieList: string): Discord.MessageEmbed => {
  const movieListEmbed = new Discord.MessageEmbed()
  .setColor('#0099ff')
  .setTitle(title)
  .setThumbnail("https://cdn0.iconfinder.com/data/icons/social-media-2219/50/61-512.png")
  .setDescription(movieList)
  .setTimestamp();
  return movieListEmbed;
}
