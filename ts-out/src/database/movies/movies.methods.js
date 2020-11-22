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
function setLastUpdated() {
    return __awaiter(this, void 0, void 0, function* () {
        const now = new Date();
        if (!this.lastUpdated || this.lastUpdated < now) {
            this.lastUpdated = now;
            yield this.save();
        }
    });
}
exports.setLastUpdated = setLastUpdated;
function sameYear() {
    return __awaiter(this, void 0, void 0, function* () {
        return this.model("Movie").find({ year: this.year });
    });
}
exports.sameYear = sameYear;
function updateWatched(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const newWatched = [...this.watched, user];
        return this.model("Movie").updateOne(this, { $set: { watched: newWatched } });
    });
}
exports.updateWatched = updateWatched;
//# sourceMappingURL=movies.methods.js.map