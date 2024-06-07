const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 3000;


const serviceAccount = require('./key.json'); 


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const db = admin.firestore();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/login', (req, res) => {
    res.render('login', { error: null }); 
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null }); 
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            res.render('login', { error: 'User does not exist' });
        } else {
            const user = doc.data();
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                res.redirect('/lyrics');
            } else {
                res.render('login', { error: 'Incorrect password' });
            }
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        console.log(`User exists: ${doc.exists}`); // Debug statement

        if (doc.exists) {
            res.render('signup', { error: 'User already exists' });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10); 
            await userRef.set({ email, password: hashedPassword });
            res.redirect('/lyrics');
        }
    } catch (error) {
        console.error("Error signing up:", error);
        res.render('signup', { error: 'An error occurred. Please try again.' });
    }
});

app.get('/lyrics', (req, res) => {
    res.render('lyrics', { lyrics: null });
});

app.post('/lyrics', async (req, res) => {
    const { artist, title } = req.body;

    console.log(`Received form data: Artist - ${artist}, Title - ${title}`);

    try {
        
        const response = await axios.get(`https://api.lyrics.ovh/v1/${artist}/${title}`);
        const lyrics = response.data.lyrics;

        res.render('lyrics', { lyrics: { artist, title, lyrics } });
    } catch (error) {
        console.error("Error fetching lyrics:", error);
        res.render('lyrics', { lyrics: null });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
