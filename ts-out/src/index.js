"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const Discord = __importStar(require("discord.js"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const database_1 = require("./database/database");
// Create Client
const client = new Discord.Client();
// Login to server
client.login(process.env.TOKEN);
// Connect to MongoDB
const db = database_1.connect();
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});
client.on('message', msg => {
    const command = exports.parseCommand(msg.content);
    if (command) {
        exports.handleOperation(command, msg);
    }
});
exports.parseCommand = (message) => {
    // Validate bot command
    if (!message.startsWith('::')) {
        return;
    }
    // Parse args
    // A year can be included if comma spaced after the title, ex: Suspiria, 1977
    const commandRegex = /::(\w*)\s?([\w\s\+\-]*)?,?\s?((?:\w+|,\s?)*)?/g;
    const matches = commandRegex.exec(message);
    return matches.slice(1);
};
exports.handleOperation = (command, msg) => {
    switch (command[0]) {
        case 'lookup':
            exports.processLookupCommand(command[1], command[2])
                .then(response => msg.channel.send(exports.buildMovieEmbed(response)))
                .catch(err => msg.channel.send('Error: ' + err));
            break;
        case 'add':
            exports.processAddCommand(command[1], command[2], msg)
                .then(response => {
                if (response) {
                    msg.channel.send(response);
                }
            })
                .catch(err => sendError(err, msg));
            break;
        case 'remove':
            exports.processRemoveCommand(command[1], command[2])
                .then(response => msg.channel.send(response))
                .catch(err => sendError(err, msg));
            break;
        case 'watched':
            exports.processWatchedCommand(command[1], command[2], msg)
                .then(response => msg.channel.send(response))
                .catch(err => sendError(err, msg));
            break;
        case 'list':
            exports.processListCommand(command[1], command[2], msg)
                .then(response => msg.channel.send(response))
                .catch(err => sendError(err, msg));
            break;
        case 'random':
            exports.processRandomCommand()
                .catch(err => sendError(err, msg));
            break;
        default:
            sendError('invalid command. Valid commands: lookup, add, delete, watched, random', msg);
            return;
    }
};
const sendError = (error, msg) => {
    if (error && msg) {
        msg.channel.send('🤯  Error: ' + error);
    }
};
exports.processLookupCommand = (title, year) => __awaiter(void 0, void 0, void 0, function* () {
    return yield exports.fetchMovieData(title, year);
});
exports.processAddCommand = (title, year, message) => __awaiter(void 0, void 0, void 0, function* () {
    const movie = yield exports.fetchMovieData(title, year);
    const existingMovie = yield db.MovieModel.findByTitleYear(movie.Title, movie.Year);
    if (existingMovie) {
        const createDate = existingMovie.lastUpdated.toISOString().split('T')[0];
        return `🤖  Movie is already on the list! ${existingMovie.title} was added on ${createDate} by ${existingMovie.createUser}  🤖`;
    }
    // Confirm that the movie fetched was the one they want
    const lookup = yield message.channel.send(exports.buildMovieEmbed(movie));
    const confirmation = yield message.channel.send(message.author.toString() + ' React here with  👍  to add this movie, or  👎  to cancel.');
    const filter = (reaction, user) => ['👍', '👎'].includes(reaction.emoji.name) && user.id === message.author.id;
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
});
exports.processRemoveCommand = (title, year) => __awaiter(void 0, void 0, void 0, function* () {
    const existingMovie = yield db.MovieModel.findByTitleYear(title, year);
    if (!existingMovie) {
        throw 'Movie not found!';
    }
    yield db.MovieModel.deleteOne(existingMovie);
    return `🤖  ${existingMovie.title} was removed from the list.  🤖`;
});
exports.processWatchedCommand = (title, year, message) => __awaiter(void 0, void 0, void 0, function* () {
    const existingMovie = yield db.MovieModel.findByTitleYear(title, year);
    if (!existingMovie) {
        throw 'Movie not found!';
    }
    // Update watched with user
    existingMovie.updateWatched(message.author.username);
    return `🤖  ${existingMovie.title}(${existingMovie.year}) has been marked as watched by ${message.author.username}!  🤖`;
});
exports.processListCommand = (subCommands, additionalArgs, message) => __awaiter(void 0, void 0, void 0, function* () {
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
        return exports.movieListToEmbed(yield db.MovieModel.firstXRecords(100));
    }
    const subCommandArgs = subCommands.split(' ');
    const firstArg = parseInt(subCommands[0]);
    if (!isNaN(firstArg)) {
        return exports.movieListToEmbed(yield db.MovieModel.firstXRecords(firstArg));
    }
    switch (subCommandArgs[0]) {
        case 'unwatched':
            // First name will always be in 2nd arg ex ['list', 'watched Owen', 'Wilson, Garrison']
            let unwatchUsers = mergeUserArgs(subCommandArgs[1], additionalArgs);
            return exports.movieListToEmbed(yield db.MovieModel.findByWatched(false, unwatchUsers), "Unwatched Movies");
        case 'watched':
            let watchUsers = mergeUserArgs(subCommandArgs[1], additionalArgs);
            return exports.movieListToEmbed(yield db.MovieModel.findByWatched(true, watchUsers), "Watched Movies");
        case 'genre':
            // I'm limiting genre to one string for now. Maybe in the future I can parse for multiple
            exports.validateArgExists(subCommandArgs[1], "No genre provided!");
            return exports.movieListToEmbed(yield db.MovieModel.findByGenre(subCommandArgs[1]), `${subCommandArgs[1]} Movies`);
        case 'person':
            exports.validateArgExists(subCommandArgs[1], "No person provided!");
            return exports.movieListToEmbed(yield db.MovieModel.findByPerson(subCommandArgs[1]), `Movies with ${subCommandArgs[1]}`);
        case 'year':
            // '+' or '-' after year indicates all movies before or after that year. 'year-year' is all movies in that span. (both ends are inclusive)
            exports.validateArgExists(subCommandArgs[1], "No year/s provided!");
            return isYearRange(subCommandArgs[1]) ? handleYearRange(subCommandArgs[1]) :
                exports.movieListToEmbed(yield db.MovieModel.findByYear(+subCommandArgs[1]), `Movies from ${subCommandArgs[1]}`);
        case 'addedBy':
            // 
            exports.validateArgExists(subCommandArgs[1], "No username provided!");
            return;
            break;
        default:
            throw 'invalid list command. Valid list commands are unwatched, watched, genre, person, year, addedBy';
    }
});
const mergeUserArgs = (firstUser, additionalUsers) => {
    let users = firstUser ? [firstUser] : undefined;
    if (additionalUsers) {
        let userArr = additionalUsers.split(',').map(user => user.trim());
        users = [...users, ...userArr];
    }
    return users;
};
const isYearRange = (commandArg) => {
    const commandRegex = /\d{4}-\d{4}|\d{4}\+|\d{4}\-/g;
    const matches = commandRegex.exec(commandArg);
    return matches != undefined;
};
const handleYearRange = (rangeStr) => __awaiter(void 0, void 0, void 0, function* () {
    if (isIncreasingRange(rangeStr)) {
        const year = cutoffRangeSymbol(rangeStr);
        return exports.movieListToEmbed(yield db.MovieModel.findByYearRange(year), `Movies from ${year} on`);
    }
    else if (isDecreasingRange(rangeStr)) {
        const year = cutoffRangeSymbol(rangeStr);
        return exports.movieListToEmbed(yield db.MovieModel.findByYearRange(0, year), `Movies from before ${year}`);
    }
    const years = extractFullRange(rangeStr);
    return exports.movieListToEmbed(yield db.MovieModel.findByYearRange(years[0], years[1]), `Movies from ${years[0]} to ${years[1]}`);
});
const isIncreasingRange = (rangeStr) => {
    const commandRegex = /\d{4}\+/g;
    const matches = commandRegex.exec(rangeStr);
    return matches != undefined;
};
const isDecreasingRange = (rangeStr) => {
    const commandRegex = /\d{4}\-$/g;
    const matches = commandRegex.exec(rangeStr);
    return matches != undefined;
};
const extractFullRange = (rangeStr) => {
    const commandRegex = /(\d{4})-(\d{4})/g;
    const matches = commandRegex.exec(rangeStr);
    if (matches.length === 3) {
        return [+matches[1], +matches[2]];
    }
    throw "Unable to parse range string";
};
const cutoffRangeSymbol = (range) => {
    return +range.slice(0, -1);
};
exports.validateArgExists = (arg, errMessage) => {
    if (arg) {
        return true;
    }
    else {
        throw errMessage;
    }
};
exports.movieListToEmbed = (movies, listTitle) => __awaiter(void 0, void 0, void 0, function* () {
    if (movies.length > 0) {
        const movieStrings = exports.stringifyMovieList(movies);
        return exports.buildMovieListEmbed(listTitle || "Movie List", movieStrings);
    }
    throw "No movies in your list yet!";
});
exports.stringifyMovieList = (movieList) => {
    let listString = "";
    movieList.forEach(movie => {
        listString += `${movie.title} (${movie.year})\n`;
    });
    return listString;
};
exports.processRandomCommand = () => {
    return Promise.resolve("stub");
};
exports.fetchMovieData = (title, year) => __awaiter(void 0, void 0, void 0, function* () {
    if (!title) {
        throw "No title provided.";
    }
    let fetchUrl = `http://www.omdbapi.com/?apikey=${process.env.OMDB_KEY}&t=${title}`;
    if (year) {
        fetchUrl += `&y=${year}`;
    }
    try {
        const response = yield node_fetch_1.default(fetchUrl, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
        });
        const movie = yield response.json();
        // Error has content if the response was bad
        if (movie.Error) {
            throw movie.Error;
        }
        return movie;
    }
    catch (err) {
        throw err;
    }
});
exports.buildMovieEmbed = (movie) => {
    const movieEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(movie.Title)
        .setDescription(movie.Plot)
        .setThumbnail("https://cdn0.iconfinder.com/data/icons/social-media-2219/50/61-512.png")
        .addFields({ name: 'Runtime', value: movie.Runtime, inline: true }, { name: 'Director', value: movie.Director, inline: true }, { name: 'Actors', value: movie.Actors }, { name: 'Genre', value: movie.Genre }, { name: 'Year Released', value: movie.Year, inline: true })
        .setImage(movie.Poster)
        .setTimestamp();
    return movieEmbed;
};
exports.buildMovieListEmbed = (title, movieList) => {
    const movieListEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(title)
        .setThumbnail("https://cdn0.iconfinder.com/data/icons/social-media-2219/50/61-512.png")
        .setDescription(movieList)
        .setTimestamp();
    return movieListEmbed;
};
//# sourceMappingURL=index.js.map