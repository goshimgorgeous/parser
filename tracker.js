const fs = require('fs').promises;

const TRACKER_FILE = 'sent_matches.json';

async function loadSentMatches() {
    try {
        const data = await fs.readFile(TRACKER_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

async function isDuplicate(url) {
    // const sentMatches = await loadSentMatches();
    // const baseUrl = url.split('/').slice(0, -1).join('/');
    // return !!sentMatches[baseUrl];
    return false; // Отключаем проверку дубликатов
}

async function saveSentMatch(url) {
    // const sentMatches = await loadSentMatches();
    // const baseUrl = url.split('/').slice(0, -1).join('/');
    // sentMatches[baseUrl] = new Date().toISOString().split('T')[0];
    // await fs.writeFile(TRACKER_FILE, JSON.stringify(sentMatches, null, 2));
}

module.exports = { isDuplicate, saveSentMatch };