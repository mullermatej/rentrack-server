import mongo from 'mongodb';
import bcrypt from 'bcrypt';
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
};
