"use strict";
/**
 * Nonogram Codex Package
 *
 * Sealed nine-plate recursive operator engine with Operator Console interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOperatorConsole = exports.OperatorConsole = exports.createNonogramCodex = exports.NonogramCodex = void 0;
var engine_1 = require("./engine");
Object.defineProperty(exports, "NonogramCodex", { enumerable: true, get: function () { return engine_1.NonogramCodex; } });
Object.defineProperty(exports, "createNonogramCodex", { enumerable: true, get: function () { return engine_1.createNonogramCodex; } });
var console_1 = require("./console");
Object.defineProperty(exports, "OperatorConsole", { enumerable: true, get: function () { return console_1.OperatorConsole; } });
Object.defineProperty(exports, "createOperatorConsole", { enumerable: true, get: function () { return console_1.createOperatorConsole; } });
