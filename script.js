// File upload handler
const fileInput = document.getElementById('fileInput');
const results = document.getElementById('results');

fileInput.addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const content = e.target.result;
        analyzeChat(content);
    };
    reader.readAsText(file);
}

function analyzeChat(content) {
    const lines = content.split('\n');
    const messages = [];
    const users = new Set();
    let mediaCount = 0;
    let emojiCount = 0;
    let linkCount = 0;
    let totalWords = 0;
    const emojiMap = {};
    const userStats = {};
    const datePattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2})\s*([ap]m)?\s*-\s*/i;

    lines.forEach(line => {
        const match = line.match(datePattern);
        if (match) {
            const messagePart = line.substring(match[0].length);
            const authorMatch = messagePart.match(/^([^:]+):\s*(.*)$/);

            if (authorMatch) {
                const author = authorMatch[1].trim();
                const message = authorMatch[2].trim();

                users.add(author);
                messages.push({ author, message });

                // Initialize user stats
                if (!userStats[author]) {
                    userStats[author] = {
                        messages: 0,
                        words: 0,
                        media: 0,
                        emojis: 0,
                        links: 0
                    };
                }

                userStats[author].messages++;

                // Count media
                if (message.includes('<Media omitted>') || message.includes('image omitted') || message.includes('video omitted')) {
                    mediaCount++;
                    userStats[author].media++;
                }

                // Count words
                const words = message.split(/\s+/).filter(w => w.length > 0);
                totalWords += words.length;
                userStats[author].words += words.length;

                // Count emojis
                const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                const emojis = message.match(emojiRegex) || [];
                emojiCount += emojis.length;
                userStats[author].emojis += emojis.length;

                emojis.forEach(emoji => {
                    emojiMap[emoji] = (emojiMap[emoji] || 0) + 1;
                });

                // Count links
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const links = message.match(urlRegex) || [];
                linkCount += links.length;
                userStats[author].links += links.length;
            }
        }
    });

    // Display results
    displayResults(messages.length, users.size, mediaCount, emojiCount, linkCount, totalWords, userStats, emojiMap);
}

function displayResults(totalMessages, totalUsers, mediaCount, emojiCount, linkCount, wordCount, userStats, emojiMap) {
    // Show results section
    results.classList.remove('hidden');

    // Update stats cards
    document.getElementById('totalMessages').textContent = totalMessages.toLocaleString();
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('mediaCount').textContent = mediaCount.toLocaleString();
    document.getElementById('emojiCount').textContent = emojiCount.toLocaleString();
    document.getElementById('linkCount').textContent = linkCount.toLocaleString();
    document.getElementById('wordCount').textContent = wordCount.toLocaleString();

    // Display user stats
    const userStatsContainer = document.getElementById('userStatsContainer');
    userStatsContainer.innerHTML = '';

    Object.entries(userStats).forEach(([user, stats]) => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.innerHTML = `
            <h3>${user}</h3>
            <div class="user-stat">
                <span class="user-stat-label">Messages:</span>
                <span class="user-stat-value">${stats.messages.toLocaleString()}</span>
            </div>
            <div class="user-stat">
                <span class="user-stat-label">Words:</span>
                <span class="user-stat-value">${stats.words.toLocaleString()}</span>
            </div>
            <div class="user-stat">
                <span class="user-stat-label">Avg Words/Message:</span>
                <span class="user-stat-value">${(stats.words / stats.messages).toFixed(1)}</span>
            </div>
            <div class="user-stat">
                <span class="user-stat-label">Media:</span>
                <span class="user-stat-value">${stats.media}</span>
            </div>
            <div class="user-stat">
                <span class="user-stat-label">Emojis:</span>
                <span class="user-stat-value">${stats.emojis}</span>
            </div>
            <div class="user-stat">
                <span class="user-stat-label">Links:</span>
                <span class="user-stat-value">${stats.links}</span>
            </div>
        `;
        userStatsContainer.appendChild(userCard);
    });

    // Display top emojis
    const emojiList = document.getElementById('emojiList');
    const topEmojis = Object.entries(emojiMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

    emojiList.innerHTML = '<div class="emoji-grid">' +
        topEmojis.map(([emoji, count]) => `
            <div class="emoji-item">
                <span class="emoji">${emoji}</span>
                <span class="count">${count}</span>
            </div>
        `).join('') +
        '</div>';

    // Create chart
    createMessageChart(userStats);

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth' });
}

function createMessageChart(userStats) {
    const ctx = document.getElementById('messageChart');

    // Destroy existing chart if any
    if (window.messageChartInstance) {
        window.messageChartInstance.destroy();
    }

    const users = Object.keys(userStats);
    const messageCounts = users.map(user => userStats[user].messages);

    window.messageChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: users,
            datasets: [{
                label: 'Messages Sent',
                data: messageCounts,
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Smooth scroll
document.addEventListener('DOMContentLoaded', function () {
    console.log('WhatsApp Chat Analyzer loaded successfully!');
});
