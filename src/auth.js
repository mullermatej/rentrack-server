import dotenv from 'dotenv';
dotenv.config();
import mongo from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connect from './db.js';

(async () => {
	const db = await connect();
	// Kreiraj indeks na polje username u kolekciji users, koji je jedinstven
	await db.collection('users').createIndex({ username: 1 }, { unique: true });
})();

export default {
	async registerUser(userData) {
		const db = await connect();

		let doc = {
			username: userData.username,
			password: await bcrypt.hash(userData.password, 8),
		};
		try {
			const result = await db.collection('users').insertOne(doc);

			if (result && result.insertedId) {
				return result.insertedId;
			}
		} catch (e) {
			if (e.code === 11000) {
				throw new Error(`User '${e.keyValue.username}' already exists`);
			}
		}
	},
	async createProfile(profileData) {
		const db = await connect();

		let doc = {
			adminId: profileData.adminId,
			name: profileData.name,
			surname: profileData.surname,
			password: await bcrypt.hash(profileData.password, 8),
		};
		try {
			const result = await db.collection('profiles').insertOne(doc);

			if (result && result.insertedId) {
				return result.insertedId;
			}
		} catch (e) {
			console.log(e);
		}
	},
	async authenticateUser(username, password) {
		const db = await connect();
		const user = await db.collection('users').findOne({ username });

		if (user && user.password && (await bcrypt.compare(password, user.password))) {
			delete user.password;
			let token = jwt.sign(user, process.env.JWT_SECRET, {
				algorithm: 'HS512',
				expiresIn: '1 week',
			});
			return {
				token,
				username: user.username,
				adminId: user._id,
			};
		} else {
			throw new Error('Cannot authenticate');
		}
	},
	async authenticateProfile(profile) {
		const db = await connect();
		const profileData = await db
			.collection('profiles')
			.findOne({ adminId: profile.adminId, name: profile.name, surname: profile.surname });

		if (profileData && profileData.password && (await bcrypt.compare(profile.password, profileData.password))) {
			delete profileData.password;
			let token = jwt.sign(profileData, process.env.JWT_SECRET, {
				algorithm: 'HS512',
				expiresIn: '1 week',
			});
			return {
				token,
				name: profileData.name,
				surname: profileData.surname,
				profileId: profileData._id,
			};
		} else {
			throw new Error('Cannot authenticate');
		}
	},
	async authenticateEquipmentAdd(username, password) {
		const db = await connect();
		const user = await db.collection('users').findOne({ username });

		if (user && user.password && (await bcrypt.compare(password, user.password))) {
			delete user.password;
			return {
				message: 'Authenticated',
			};
		} else {
			throw new Error('Cannot authenticate');
		}
	},
	async verify(req, res, next) {
		try {
			const authorization = req.headers.authorization.split(' ');
			const type = authorization[0];
			const token = authorization[1];

			if (type !== 'Bearer') {
				return res.status(401).send();
			} else {
				req.jwt = jwt.verify(token, process.env.JWT_SECRET);
				return next();
			}
		} catch (e) {
			return res.status(401).send();
		}
	},
};
