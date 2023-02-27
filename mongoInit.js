const { MongoClient } = require("mongodb");

module.exports = async function mongoInit() {
	
	const options = {
		useNewUrlParser: true,
		useUnifiedTopology: true
	};
	
	try {
		
		const client1 = new MongoClient("mongodb://127.0.0.1:27017/", options);
		const con1 = await client1.connect();
		
		const test = con1.db("test");
		
		
		if (test) {
			console.log("[OK] Connected to MongoDB");
			db = test;
		};
		
		return db;
		
	} catch (err) {
		console.log( err );
		console.log("[ERR] MongoDB error");
		
		return null;
	};
	
};