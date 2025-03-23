"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const cvController_1 = require("../controllers/cvController");
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.send("Hello, TypeScript Express!");
});
router.post("/upload-cv", uploadMiddleware_1.uploadCV, cvController_1.uploadAndAnalyzeCV);
exports.default = router;
