const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/pigFarmGame', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pigs: { type: Array, default: [] },
    coins: { type: Number, default: 0 },
    guilds: { type: Array, default: [] },
    playerGuild: { type: String, default: null },
    marketplace: { type: Array, default: [] }
});

const User = mongoose.model('User', userSchema);

const JWT_SECRET = 'your_jwt_secret';
const JWT_EXPIRATION = '1h';

// ฟังก์ชันสำหรับสร้างโทเค็น
function createToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: 'Username already exists!' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = createToken(user._id);
        res.json({ success: true, token });
    } else {
        res.json({ success: false, message: 'Invalid username or password!' });
    }
});

app.post('/api/refreshToken', (req, res) => {
    const { token } = req.body;
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        const newToken = createToken(decoded.userId);
        res.json({ success: true, token: newToken });
    });
});

app.post('/api/saveGame', async (req, res) => {
    const { token, pigs, coins, guilds, playerGuild, marketplace } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        try {
            await User.updateOne({ _id: decoded.userId }, { pigs, coins, guilds, playerGuild, marketplace });
            res.json({ success: true });
        } catch (error) {
            console.error('Error saving game data:', error);
            res.json({ success: false, message: 'Error saving game data.' });
        }
    });
});

app.post('/api/getGameData', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
        const user = await User.findById(decoded.userId);
        if (user) {
            res.json({
                pigs: user.pigs,
                coins: user.coins,
                guilds: user.guilds,
                playerGuild: user.playerGuild,
                marketplace: user.marketplace
            });
        } else {
            res.json({ success: false, message: 'User not found!' });
        }
    });
});

app.get('/api/leaderboard', async (req, res) => {
    const leaderboard = await User.find().sort({ coins: -1 }).limit(10).select('username coins');
    res.json({ success: true, leaderboard });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
