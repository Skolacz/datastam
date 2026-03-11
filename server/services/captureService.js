const fetch = require('node-fetch');

async function captureStory(url) {

    const response = await fetch('http://localhost:3000/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    if (!response.ok) {
        throw new Error('Capture API failed');
    }

    const data = await response.json();

    return data;
}

module.exports = captureStory;