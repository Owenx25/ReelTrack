"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const movies_methods_1 = require("./movies.methods");
const movies_statics_1 = require("./movies.statics");
const MovieSchema = new mongoose_1.Schema({
    title: String,
    genre: [String],
    director: String,
    actors: [String],
    year: Number,
    watched: [String],
    createDate: { type: Date },
    createUser: String,
    lastUpdated: {
        type: Date,
        default: new Date()
    }
});
MovieSchema.index({ director: 'text', actors: 'text' });
MovieSchema.statics.findOneOrCreate = movies_statics_1.findOneOrCreate;
MovieSchema.statics.findByYear = movies_statics_1.findByYear;
MovieSchema.statics.findByYearRange = movies_statics_1.findByYearRange;
MovieSchema.statics.findByTitleYear = movies_statics_1.findByTitleYear;
MovieSchema.statics.insertMovie = movies_statics_1.insertMovie;
MovieSchema.statics.firstXRecords = movies_statics_1.firstXRecords;
MovieSchema.statics.findByWatched = movies_statics_1.findByWatched;
MovieSchema.statics.findByGenre = movies_statics_1.findByGenre;
MovieSchema.statics.findByPerson = movies_statics_1.findByPerson;
MovieSchema.methods.setLastUpdated = movies_methods_1.setLastUpdated;
MovieSchema.methods.sameYear = movies_methods_1.sameYear;
MovieSchema.methods.updateWatched = movies_methods_1.updateWatched;
exports.default = MovieSchema;
//# sourceMappingURL=movies.schema.js.map