const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TOOLS_FILE = path.join(__dirname, 'tools.json');

// --- Middleware ---
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Allow the server to parse JSON in request bodies
app.use(express.json());

// --- Helper Functions ---
const readTools = () => {
    try {
        if (fs.existsSync(TOOLS_FILE)) {
            const data = fs.readFileSync(TOOLS_FILE);
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading or parsing tools.json:", error);
    }
    // If file doesn't exist or is corrupt, return an empty object
    return {};
};

const writeTools = (data) => {
    try {
        fs.writeFileSync(TOOLS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing to tools.json:", error);
    }
};

// --- API Routes ---

/**
 * Route to receive a shared link, decode it, and save the tool.
 * Expects a POST request with a JSON body: { "sharedUrl": "https://example.com/#BASE64_CODE" }
 */
app.post('/create-from-share', (req, res) => {
    const { sharedUrl } = req.body;

    if (!sharedUrl || !sharedUrl.includes('#')) {
        return res.status(400).json({ success: false, message: 'Invalid or missing shared URL.' });
    }

    // Extract the Base64 part of the URL
    const base64Code = sharedUrl.split('#')[1];
    if (!base64Code) {
        return res.status(400).json({ success: false, message: 'No Base64 code found in the URL.' });
    }

    try {
        // Decode the Base64 string back into HTML
        const decodedHtml = Buffer.from(base64Code, 'base64').toString('utf8');
        
        // Generate a simple, unique ID for the tool
        const toolId = Date.now().toString(36) + Math.random().toString(36).substr(2);

        // Read existing tools, add the new one, and write back
        const tools = readTools();
        tools[toolId] = decodedHtml;
        writeTools(tools);

        // Generate the new, permanent, shareable link for viewing
        const permanentLink = `${req.protocol}://${req.get('host')}/view/${toolId}`;

        // Send the permanent link back to the client
        res.json({ success: true, link: permanentLink });

    } catch (error) {
        console.error("Decoding or saving error:", error);
        res.status(500).json({ success: false, message: 'Failed to decode or save the tool.' });
    }
});

/**
 * Route to view a saved tool.
 * When a user visits /view/some-id, this serves the corresponding HTML.
 */
app.get('/view/:toolId', (req, res) => {
    const { toolId } = req.params;
    const tools = readTools();
    
    const toolHtml = tools[toolId];

    if (toolHtml) {
        // If the tool is found, send the raw HTML as the response
        res.send(toolHtml);
    } else {
        // If not found, send a 404 error
        res.status(404).send('<h1>404 - Tool Not Found</h1><p>The link may be broken or the tool may have been removed.</p>');
    }
});


// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Tool Sharer server is running on http://localhost:${PORT}`);
});
