const express = require('express');
const app = express();

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.get('/api', (req, res) => {
	res.json({ users: ['user1', 'user2', 'user3'] });
});

app.listen(3000, () => {
	console.log('Server is running on port 3000');
});
