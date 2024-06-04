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
		const result = await auth.authenticateUser(user.oib, user.password);
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

// app.post('/auth/equipment', async (req, res) => {
// 	const user = req.body;

// 	try {
// 		const result = await auth.authenticateEquipmentAdd(user.username, user.password);
// 		res.json(result);
// 	} catch (e) {
// 		res.status(401).json({ error: e.message });
// 	}
// });

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

app.get('/users/:businessId/profiles', async (req, res) => {
	const profiles = await db.collection('profiles').find({ businessId: req.params.businessId }).toArray();

	res.json(profiles);
});
app.post('/users/:businessId/profiles', async (req, res) => {
	let profile = req.body;

	try {
		const id = await auth.createProfile(profile);
		res.json({ id });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Na klijentu mozda treba za ovaj endpoint promijeniti userId u businessId
app.get('/users/:businessId/profiles/:profileId', async (req, res) => {
	const profile = await db
		.collection('profiles')
		.findOne({ _id: new mongo.ObjectId(req.params.profileId), businessId: req.params.businessId });

	res.json(profile);
});

app.patch('/users/:businessId/profiles/:profileId', async (req, res) => {
	const profile = req.body;

	try {
		const result = await db
			.collection('profiles')
			.updateOne(
				{ _id: new mongo.ObjectId(req.params.profileId), businessId: req.params.businessId },
				{ $inc: { income: profile.income } }
			);
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.delete('/users/:userId/profiles/:profileId', async (req, res) => {});

app.get('/equipment/:businessId', async (req, res) => {
	const equipment = await db.collection('equipment').find({ businessId: req.params.businessId }).toArray();

	res.json(equipment);
});

app.get('/equipment/:businessId/:name/features', async (req, res) => {
	const equipment = await db
		.collection('equipment')
		.find({ businessId: req.params.businessId, name: req.params.name })
		.toArray();

	res.json(equipment[0].features);
});

app.get('/equipment/:businessId/:name/profit', async (req, res) => {
	const equipment = await db
		.collection('equipment')
		.find({ businessId: req.params.businessId, name: req.params.name })
		.toArray();

	let profit = 0;
	equipment[0].addedEquipment.forEach((element) => {
		element.history.forEach((item) => {
			profit += parseInt(item.price);
		});
	});

	res.json({ profit });
});

app.get('/equipment/:businessId/:name', async (req, res) => {
	const equipment = await db
		.collection('equipment')
		.find({ businessId: req.params.businessId, name: req.params.name })
		.toArray();

	res.json(equipment);
});

app.post('/equipment', async (req, res) => {
	const equipment = req.body;
	const doc = {
		businessId: equipment.businessId,
		name: equipment.name,
		prices: equipment.prices,
		addedEquipment: [],
		features: equipment.features,
	};
	try {
		const result = await db.collection('equipment').insertOne(doc);
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.post('/equipment/:businessId/:name', async (req, res) => {
	const doc = req.body;

	try {
		const result = await db
			.collection('equipment')
			.updateOne(
				{ businessId: req.params.businessId, name: req.params.name },
				{ $push: { addedEquipment: doc } }
			);
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.patch('/equipment/:businessId/:name', async (req, res) => {
	const equipment = req.body;

	try {
		const result = await db.collection('equipment').findOneAndUpdate(
			{
				businessId: req.params.businessId,
				name: req.params.name,
				'addedEquipment.id': equipment.equipmentId,
			},
			{
				$set: {
					'addedEquipment.$.availability': equipment.availability,
					'addedEquipment.$.endTime': equipment.endTime,
				},
				$push: {
					'addedEquipment.$.history': {
						date: equipment.historyDate,
						worker: equipment.historyWorker,
						hours: equipment.hours,
						price: equipment.price,
					},
				},
			}
		);
		res.json({ message: 'Equipment updated' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.delete('/equipment/:businessId/:name/prices', async (req, res) => {
	const { hours } = req.body;
	const { businessId, name } = req.params;

	try {
		const result = await db
			.collection('equipment')
			.updateOne({ businessId, name }, { $unset: { [`prices.${hours}`]: '' } });
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.delete('/equipment/:businessId/:name', async (req, res) => {
	try {
		await db.collection('equipment').deleteOne({ businessId: req.params.businessId, name: req.params.name });
		res.json({ message: 'Equipment deleted' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.patch('/equipment/:businessId/:name/:equipmentId', async (req, res) => {
	const equipment = req.body;
	const equipmentId = parseInt(req.params.equipmentId);

	try {
		const result = await db.collection('equipment').findOneAndUpdate(
			{
				businessId: req.params.businessId,
				name: req.params.name,
				'addedEquipment.id': equipmentId,
			},
			{
				$set: {
					'addedEquipment.$.availability': equipment.availability,
					'addedEquipment.$.endTime': equipment.endTime,
				},
			}
		);
		res.json({ message: "Equipment's set to available" });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.delete('/equipment/:businessId/:name/:equipmentId', async (req, res) => {
	const equipmentId = parseInt(req.params.equipmentId);

	try {
		await db
			.collection('equipment')
			.findOneAndUpdate(
				{ businessId: req.params.businessId, name: req.params.name },
				{ $pull: { addedEquipment: { id: equipmentId } } }
			);
		res.json({ message: 'Equipment deleted' });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.post('/equipment/:businessId/:name/prices', async (req, res) => {
	const { hours, price } = req.body;
	const { businessId, name } = req.params;

	try {
		const result = await db
			.collection('equipment')
			.updateOne({ businessId, name }, { $set: { [`prices.${hours}`]: price } });
		res.json(result);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
