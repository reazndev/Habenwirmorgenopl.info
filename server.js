const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3001;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API endpoint to save sessions
app.post('/api/sessions', async (req, res) => {
    try {
        const { sessions } = req.body;
        const sessionsData = {
            sessions: sessions
        };
        
        await fs.writeFile(
            path.join(__dirname, 'sessions.json'), 
            JSON.stringify(sessionsData, null, 2)
        );
        
        res.json({ success: true, message: 'Sessions saved successfully' });
    } catch (error) {
        console.error('Error saving sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to save sessions' });
    }
});

// API endpoint to get sessions
app.get('/api/sessions', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'sessions.json'), 'utf8');
        const sessionsData = JSON.parse(data);
        res.json(sessionsData);
    } catch (error) {
        console.error('Error reading sessions:', error);
        res.status(500).json({ success: false, message: 'Failed to load sessions' });
    }
});

// Serve the index.html file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
