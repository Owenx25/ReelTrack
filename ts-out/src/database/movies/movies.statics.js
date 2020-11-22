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
Object.defineProperty(exports, "__esModule", { value: true });
function findOneOrCreate(movie) {
    return __awaiter(this, void 0, void 0, function* () {
        const record = yield this.findOne(movie);
        if (record) {
            return record;
        }
        else {
            return this.create(movie);
        }
    });
}
exports.findOneOrCreate = findOneOrCreate;
function insertMovie(movie, message) {
    return __awaiter(this, void 0, void 0, function* () {
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
    });
}
exports.insertMovie = insertMovie;
function findByTitleYear(title, year) {
    return __awaiter(this, void 0, void 0, function* () {
        return year ? this.findOne({ title: title, year: parseInt(year) })
            : this.findOne({ title: title });
    });
}
exports.findByTitleYear = findByTitleYear;
function findByYearRange(min, max) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ year: { $gte: min || 0, $lte: max || Infinity } });
    });
}
exports.findByYearRange = findByYearRange;
function findByYear(year) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ year: year });
    });
}
exports.findByYear = findByYear;
function firstXRecords(X) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({}, null, {}).limit(X);
    });
}
exports.firstXRecords = firstXRecords;
function findByWatched(watchedOption, users) {
    return __awaiter(this, void 0, void 0, function* () {
        if (watchedOption && users) {
            return this.find({ watched: { $exists: true, $not: { $size: 0 }, $in: users } }, null, {});
        }
        else if (watchedOption) {
            return this.find({ watched: { $exists: true, $not: { $size: 0 } } }, null, {});
        }
        else
            return this.find({ watched: { $exists: true, $size: 0 } }, null, {});
    });
}
exports.findByWatched = findByWatched;
function findByGenre(genreName) {
    return __awaiter(this, void 0, void 0, function* () {
        return this.find({ genre: genreName.toLowerCase() }, null, {});
    });
}
exports.findByGenre = findByGenre;
function findByPerson(person) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.find({ $text: { $search: person } }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: 'textScore' } });
    });
}
exports.findByPerson = findByPerson;
//# sourceMappingURL=movies.statics.js.map