"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const movies_schema_1 = __importDefault(require("./movies.schema"));
exports.MovieModel = mongoose_1.model("Movie", movies_schema_1.default);
//# sourceMappingURL=movies.model.js.map