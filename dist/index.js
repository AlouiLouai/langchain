"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cvRoutes_1 = __importDefault(require("./routes/cvRoutes"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables at the very top
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.use('/api', cvRoutes_1.default); // Mount routes under /api prefix
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
