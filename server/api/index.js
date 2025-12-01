"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const friends_1 = __importDefault(require("../src/routes/friends"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});
// API Routes
app.get('/api/hello', (_req, res) => {
    res.json({ message: 'Hello from Express backend!' });
});
// Friend relationships routes
app.use('/api/friends', friends_1.default);
// Vercel serverless function handler
exports.default = app;
//# sourceMappingURL=index.js.map