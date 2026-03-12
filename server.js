const express = require('express');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3001;

// Valid class IDs (whitelist to prevent arbitrary file access)
const VALID_CLASSES = ['i3a', 'i2a'];

function getSessionsFile(classId) {
    if (!VALID_CLASSES.includes(classId)) {
        return null;
    }
    return path.join(__dirname, `sessions-${classId}.json`);
}

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API endpoint to save sessions for a specific class
app.post('/api/sessions/:classId', async (req, res) => {
    try {
        const filePath = getSessionsFile(req.params.classId);
        if (!filePath) {
            return res.status(400).json({ success: false, message: 'Invalid class ID' });
        }

        const { sessions } = req.body;
        const sessionsData = { sessions };
        
        await fs.writeFile(filePath, JSON.stringify(sessionsData, null, 2));
        res.json({ success: true, message: 'Sessions saved successfully' });
    } catch (error) {
        console.error('Error saving sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to save sessions' });
    }
});

// API endpoint to get sessions for a specific class
app.get('/api/sessions/:classId', async (req, res) => {
    try {
        const filePath = getSessionsFile(req.params.classId);
        if (!filePath) {
            return res.status(400).json({ success: false, message: 'Invalid class ID' });
        }

        const data = await fs.readFile(filePath, 'utf8');
        const sessionsData = JSON.parse(data);
        res.json(sessionsData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.json({ sessions: [] });
        }
        console.error('Error reading sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to load sessions' });
    }
});

// Legacy routes (backwards compatible - default to i3a)
app.post('/api/sessions', async (req, res) => {
    try {
        const { sessions } = req.body;
        await fs.writeFile(
            path.join(__dirname, 'sessions-i3a.json'), 
            JSON.stringify({ sessions }, null, 2)
        );
        res.json({ success: true, message: 'Sessions saved successfully' });
    } catch (error) {
        console.error('Error saving sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to save sessions' });
    }
});

app.get('/api/sessions', async (req, res) => {
    try {
        let filePath = path.join(__dirname, 'sessions-i3a.json');
        try {
            await fs.access(filePath);
        } catch {
            filePath = path.join(__dirname, 'sessions.json');
        }
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to load sessions' });
    }
});

// API endpoint to verify admin password
app.post('/api/verify-password', (req, res) => {
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminPassword) {
            return res.status(500).json({ success: false, message: 'Admin password not configured' });
        }
        
        if (password === adminPassword) {
            res.json({ success: true, message: 'Password verified' });
        } else {
            res.json({ success: false, message: 'Invalid password' });
        }
    } catch (error) {
        console.error('Error verifying password:', error);
        res.status(500).json({ success: false, message: 'Failed to verify password' });
    }
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
