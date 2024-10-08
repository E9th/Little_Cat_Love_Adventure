document.addEventListener('touchstart', function() {}, true); // ป้องกัน delay การสัมผัสบนหน้าจอ

let userId = null;
let token = null;
let pigs = [];
let coins = 0;
let guilds = [];
let playerGuild = null;
let marketplace = [];
let quests = [
    { id: 1, description: "Raise 5 Economy Pigs", completed: false, reward: 50 },
    { id: 2, description: "Join a Guild", completed: false, reward: 30 },
];

async function registerUser() {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');

    if (username && password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                alert('Registration successful!');
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error registering user:', error);
            alert('Registration failed!');
        }
    } else {
        alert('Please enter a username and password.');
    }
}

async function loginUser() {
    const username = prompt('Enter your username:');
    const password = prompt('Enter your password:');
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        token = data.token;
        userId = data.userId;
        alert('Login successful!');
        loadGameData();
    } else {
        alert(data.message);
    }
}

async function loadGameData() {
    const response = await fetch('/api/getGameData', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token: yourToken }) // ให้แน่ใจว่า token ไม่เป็น undefined
})
.then(response => response.json())
.then(data => {
    console.log("Game Data:", data); // ตรวจสอบข้อมูลที่ได้รับ
})
.catch(error => console.error("Error:", error));
    if (data.success) {
        pigs = data.pigs;
        coins = data.coins;
        guilds = data.guilds;
        playerGuild = data.playerGuild;
        marketplace = data.marketplace;
        updatePigs();
        updateMarket();
        updateQuests();
        document.getElementById('auth').style.display = 'none';
        document.getElementById('farm').style.display = 'block';
        document.getElementById('guild').style.display = 'block';
        document.getElementById('arena').style.display = 'block';
        document.getElementById('weather').style.display = 'block';
        document.getElementById('marketplace').style.display = 'block';
        document.getElementById('quests').style.display = 'block';
    } else {
        alert(data.message);
    }
}

async function saveGame() {
    const response = await fetch('/api/saveGame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pigs, coins, guilds, playerGuild, marketplace })
    });
    const data = await response.json();
    if (!data.success) {
        alert('Error saving game data.');
    }
}

function updatePigs() {
    let pigListHTML = pigs.map((pig, index) =>
        `<li>Pig #${index + 1}: ${pig.type} - Coins/sec: ${pig.coinsPerSecond}, Strength: ${pig.strength}</li>`
    ).join('');
    document.getElementById('pigList').innerHTML = pigListHTML;
}

async function raisePig(pigType) {
    const response = await fetch('/api/raisePig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pigType })
    });
    const data = await response.json();
    if (data.success) {
        pigs.push(data.newPig);
        updatePigs();
        checkQuests();
    } else {
        alert(data.message);
    }
}

function updateQuests() {
    let questListHTML = quests.map(quest =>
        `<li>${quest.description} - ${quest.completed ? "Completed" : "Incomplete"}</li>`
    ).join('');
    document.getElementById('questList').innerHTML = questListHTML;
}

function checkQuests() {
    quests.forEach(quest => {
        if (!quest.completed) {
            if (quest.id === 1 && pigs.filter(pig => pig.type === 'Economy').length >= 5) {
                quest.completed = true;
                alert(`Quest completed: ${quest.description}. Reward: ${quest.reward} coins!`);
                coins += quest.reward;
                saveGame();
                displayQuestCompletion(quest); // แสดงแอนิเมชันเมื่อทำเควสต์สำเร็จ
            }
        }
    });
}

function displayQuestCompletion(quest) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = `Quest completed: ${quest.description}! Reward: ${quest.reward} coins.`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade');
        setTimeout(() => notification.remove(), 1000);
    }, 3000);
}

// ระบบพันธมิตร
async function createGuild(guildName) {
    const response = await fetch('/api/createGuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildName })
    });
    const data = await response.json();
    if (data.success) {
        guilds.push({ name: guildName, members: [], groupQuestProgress: 0 });
        updateGuildUI();
    } else {
        alert(data.message);
    }
}

async function joinGuild(guildName) {
    const response = await fetch('/api/joinGuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildName })
    });
    const data = await response.json();
    if (data.success) {
        playerGuild = guildName;
        updateGuildUI();
    } else {
        alert(data.message);
    }
}

async function contributeToGuildQuest() {
    const response = await fetch('/api/contributeToGuildQuest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerGuild })
    });
    const data = await response.json();
    if (data.success) {
        alert(`${playerGuild} completed the group quest!`);
        updateGuildUI();
    } else {
        alert(data.message);
    }
}

function updateGuildUI() {
    // อัปเดต UI สำหรับระบบพันธมิตร
}

// ระบบการต่อสู้หมู
async function battlePigs(pig1Index, pig2Index) {
    const pig1 = pigs[pig1Index];
    const pig2 = pigs[pig2Index];
    const pig1Strength = pig1.strength + Math.random() * 10;
    const pig2Strength = pig2.strength + Math.random() * 10;

    if (pig1Strength > pig2Strength) {
        alert(`Pig #${pig1Index + 1} wins!`);
    } else {
        alert(`Pig #${pig2Index + 1} wins!`);
    }
    updatePigs();
}

// ระบบสภาพอากาศ
async function changeSeason() {
    const response = await fetch('/api/changeSeason', {
        method: 'POST'
    });
    const data = await response.json();
    if (data.success) {
        alert(`Season changed to ${data.newSeason}!`);
        updatePigs();
    }
}

// ระบบตลาดกลาง
async function sellItem(item, price) {
    const response = await fetch('/api/sellItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, price })
    });
    const data = await response.json();
    if (data.success) {
        marketplace.push(item);
        updateMarket();
    } else {
        alert(data.message);
    }
}

async function buyItem(index) {
    const response = await fetch('/api/buyItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
    });
    const data = await response.json();
    if (data.success) {
        marketplace.splice(index, 1);
        updateMarket();
    } else {
        alert(data.message);
    }
}

function updateMarket() {
    let marketHTML = marketplace.map((item, index) =>
        `<li>Item: ${item.name} - Price: ${item.price} <button onclick="buyItem(${index})">Buy</button></li>`
    ).join('');
    document.getElementById('marketList').innerHTML = marketHTML;
}

// ระบบจัดอันดับผู้เล่น
async function loadLeaderboard() {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    if (data.success) {
        const leaderboardHTML = data.leaderboard.map((player, index) => 
            `<li>${index + 1}. ${player.username} - Coins: ${player.coins}</li>`
        ).join('');
        document.getElementById('leaderboard').innerHTML = leaderboardHTML;
    }
}

// โหลดข้อมูลเกมเมื่อเริ่มต้น
(async () => {
    const isRegister = confirm('Do you want to register a new account?');
    if (isRegister) {
        await registerUser();
    }
    await loginUser();
})();

