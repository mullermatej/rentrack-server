import express from 'express';
import mongo from 'mongodb';
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

app.post('/authProfile', async (req, res) => {
	const profile = req.body;

	try {
		const result = await auth.authenticateProfile(profile);
		res.json(result);
	} catch (e) {
		res.status(401).json({ error: e.message });
	}
});

app.post('/auth/equipment', async (req, res) => {
	const user = req.body;

	try {
		const result = await auth.authenticateEquipmentAdd(user.username, user.password);
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

app.get('/users/:userId/profiles', async (req, res) => {
	const profiles = await db.collection('profiles').find({ adminId: req.params.userId }).toArray();

	res.json(profiles);
});
app.post('/users/:userId/profiles', async (req, res) => {
	let profile = req.body;

	try {
		const id = await auth.createProfile(profile);
		res.json({ id });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.get('/users/:userId/profiles/:profileId', async (req, res) => {
	const profile = await db
		.collection('profiles')
		.findOne({ _id: new mongo.ObjectId(req.params.profileId), adminId: req.params.userId });

	res.json(profile);
}); /* Praćenje prihoda pojedinog radnika? */
app.patch('/users/:userId/profiles/:profileId', async (req, res) => {});
app.delete('/users/:userId/profiles/:profileId', async (req, res) => {});

app.get('/equipment/:adminId', async (req, res) => {
	const equipment = await db.collection('equipment').find({ adminId: req.params.adminId }).toArray();

	res.json(equipment);
});
app.post('/equipment', async (req, res) => {
	const equipment = req.body;
	const doc = {
		adminId: equipment.adminId,
		name: equipment.name,
		addedEquipment: [],
	};
	try {
		const result = await db.collection('equipment').insertOne(doc);
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.get('/equipment/:adminId/:name', async (req, res) => {
	const equipment = await db
		.collection('equipment')
		.find({ adminId: req.params.adminId, name: req.params.name })
		.toArray();

	res.json(equipment);
});
app.patch('/equipment/:adminId/:name', async (req, res) => {});
app.delete('/equipment/:adminId/:name', async (req, res) => {});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
