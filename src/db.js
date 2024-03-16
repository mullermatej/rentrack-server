import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = 'mongodb+srv://admin:admin@cluster0.xkwtleo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

let db = null;

function isConnected() {
	return !!client && !!client.topology && client.topology.isConnected();
}

export default async () => {
	if (!db || !isConnected()) {
		await client.connect();
		db = client.db('rentrack');
		console.log('Connected OK');
	}
	return db;
};
