import express from 'express';
import connect from './db.js';
import mongoose from 'mongoose';

mongoose.connect(
	'mongodb+srv://admin:admin@cluster0.xkwtleo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
);

const app = express();
const db = await connect();

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/api', (req, res) => {
	res.json({ users: ['user1', 'user2', 'user3'] });
});

app.get('/users', async (req, res) => {
	const users = await db.collection('users').find().toArray();

	if (!users) {
		res.status(400).send('No users found');
	}

	res.json(users);
});
app.post('/users', async (req, res) => {});

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
