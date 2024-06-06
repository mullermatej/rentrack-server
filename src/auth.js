import dotenv from 'dotenv';
dotenv.config();
import mongo from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connect from './db.js';

(async () => {
	const db = await connect();
	await db.collection('users').createIndex({ oib: 1 }, { unique: true });
})();

export default {
	async registerUser(userData) {
		const db = await connect();

		console.log('Received userData:', userData);

		let doc = {
			name: userData.name,
			oib: userData.oib,
			password: await bcrypt.hash(userData.password, 8),
		};
		try {
			const result = await db.collection('users').insertOne(doc);

			if (result && result.insertedId) {
				return result.insertedId;
			}
		} catch (e) {
			if (e.code === 11000) {
				throw new Error(e);
			}
		}
	},
	async createProfile(profileData) {
		const db = await connect();

		let doc = {
			businessId: profileData.businessId,
			name: profileData.name,
			surname: profileData.surname,
			income: 0,
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
	async authenticateUser(oib, password) {
		const db = await connect();
		const user = await db.collection('users').findOne({ oib });

		if (user && user.password && (await bcrypt.compare(password, user.password))) {
			delete user.password;
			let token = jwt.sign(user, process.env.JWT_SECRET, {
				algorithm: 'HS512',
				expiresIn: '1 week',
			});
			return {
				token,
				oib: user.oib,
				name: user.name,
				businessId: user._id,
			};
		} else {
			throw new Error('Cannot authenticate');
		}
	},
	async authenticateProfile(profile) {
		const db = await connect();
		const profileData = await db
			.collection('profiles')
			.findOne({ businessId: profile.businessId, name: profile.name, surname: profile.surname });

		if (profileData) {
			return {
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
