"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const connectors_1 = __importDefault(require("./routes/connectors"));
const app = (0, express_1.default)();
const port = 8100;
app.use(express_1.default.json());
app.use('/api/tasks', tasks_1.default);
app.use('/api/connectors', connectors_1.default);
// Serve static frontend build
const frontendDist = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDist));
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Fallback to index.html for SPA routing
app.use((req, res) => {
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}
exports.default = app;
