import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import connect from './db.js';
import auth from './auth.js';

mongoose.connect(
	'mongodb+srv://admin:admin@cluster0.xkwtleo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
);

const app = express();
const db = await connect();

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
	res.json({ users: ['user1', 'user2', 'user3'] });
});

app.get('/secret', [auth.verify], (req, res) => {
	res.json({ message: 'This is a secret message ' + req.jwt.username });
});

app.post('/auth', async (req, res) => {
	const user = req.body;

	try {
		const result = await auth.authenticateUser(user.username, user.password);
		res.json(result);
	} catch (e) {
		res.status(401).json({ error: e.message });
	}
});

app.get('/users', async (req, res) => {
	const users = await db.collection('users').find().toArray();

	if (!users) {
		res.status(400).send('No users found');
	}

	res.json(users);
});
app.post('/users', async (req, res) => {
	let user = req.body;

	try {
		const id = await auth.registerUser(user);
		res.json({ id });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.get('/users/:userId', async (req, res) => {});
app.patch('/users/:userId', async (req, res) => {});
app.delete('/users/:userId', async (req, res) => {});

app.get('/users/:userId/profiles', async (req, res) => {});
app.post('/users/:userId/profiles', async (req, res) => {});

app.get('/users/:userId/profiles/:profileId', async (req, res) => {}); /* Praćenje prihoda pojedinog radnika? */
app.patch('/users/:userId/profiles/:profileId', async (req, res) => {});
app.delete('/users/:userId/profiles/:profileId', async (req, res) => {});

app.get('/equipment', async (req, res) => {});
app.post('/equipment', async (req, res) => {});

app.get('/equipment/:equipmentId', async (req, res) => {});
app.patch('/equipment/:equipmentId', async (req, res) => {});
app.delete('/equipment/:equipmentId', async (req, res) => {});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
