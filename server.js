const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = process.env.PORT || 3000;
const TOOLS_FILE = path.join(__dirname, 'tools.json');

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for all routes
app.use(express.static('public'));
app.use(express.json());

// --- Helper Functions ---
const readTools = () => {
    try {
        if (fs.existsSync(TOOLS_FILE)) {
            const data = fs.readFileSync(TOOLS_FILE);
            return JSON.parse(data);
        }
    } catch (error) { console.error("Error reading tools.json:", error); }
    return {}; // Return empty object if file doesn't exist or is corrupt
};

const writeTools = (data) => {
    try {
        fs.writeFileSync(TOOLS_FILE, JSON.stringify(data, null, 2));
    } catch (error) { console.error("Error writing to tools.json:", error); }
};

// --- API Routes ---

// POST /publish-to-gallery - Receives a new tool and saves it
app.post('/publish-to-gallery', (req, res) => {
    const { prompt, code } = req.body;
    if (!prompt || !code) {
        return res.status(400).json({ success: false, message: 'Missing prompt or code.' });
    }

    const toolId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const newTool = {
        id: toolId,
        prompt: prompt,
        code: code,
        likes: 0,
        createdAt: new Date().toISOString()
    };

    const tools = readTools();
    tools[toolId] = newTool;
    writeTools(tools);

    res.json({ success: true, message: 'Tool published to the gallery!', toolId: toolId });
});

// GET /gallery - Serves all tools for the gallery page
app.get('/gallery', (req, res) => {
    const tools = readTools();
    // Convert the object of tools into an array
    const toolsArray = Object.values(tools);
    res.json(toolsArray);
});

// POST /like/:toolId - Increments the like count for a tool
app.post('/like/:toolId', (req, res) => {
    const { toolId } = req.params;
    const tools = readTools();
    
    if (tools[toolId]) {
        tools[toolId].likes += 1;
        writeTools(tools);
        res.json({ success: true, likes: tools[toolId].likes });
    } else {
        res.status(404).json({ success: false, message: 'Tool not found.' });
    }
});

// --- Existing Routes for Base64 Sharing ---
app.post('/create-from-share', (req, res) => { /* ... existing code ... */ });
app.get('/view/:toolId', (req, res) => { /* ... existing code ... */ });


app.listen(PORT, () => {
    console.log(`Tool Sharer server is running on http://localhost:${PORT}`);
});
