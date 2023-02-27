
const mongoInit = require("./mongoInit.js");


/** @type {import("mongodb").Db} */
let db;


const generateRandomString = (length) => {
	let result = "";
	
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const charactersLength = characters.length;
	
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	
	return result;
};

const generateRandomNumber = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};


async function populateMongo() {
	
	// Drop first
	const collections = [
		"users_100", "items_100", "orders_100",
		"users_1000", "items_1000", "orders_1000",
		"users_10000", "items_10000", "orders_10000",
	];
	
	for await (let _colName of collections) {
		console.log( `Deleting ${_colName}...` )
		await db.collection(_colName).deleteMany({});
		console.log( "OK" )
	}
	
	
	// Populate
	for await (let _colName of collections) {
		
		console.log( `Collection ${_colName}...` )
		
		let [colType, quantity] = _colName.split("_"); // "users_100" --> ["users", "100"]
		quantity = parseInt(quantity);
		
		const docsToInsert = []
		
		// Generate
		if (colType === "users") {
			for (let _i = 0; _i < quantity; _i++) {
				docsToInsert.push({
					name: "u_" + generateRandomString(10),
					last_name: generateRandomString(10),
					email: `${generateRandomString(10)}@mail.com`,
				})
			}
		} else if (colType === "items") {
			for (let _i = 0; _i < quantity; _i++) {
				docsToInsert.push({
					name: "i_" + generateRandomString(10),
					stock: generateRandomNumber(1, 100),
					price: generateRandomNumber(10, 1000),
				})
			}
		} else if (colType === "orders") {
			
			const randomUsers = await db.collection(`users_${quantity}`).aggregate([{
				$sample: {size: quantity}
			}]).toArray();
			
			const randomItems = await db.collection(`items_${quantity}`).aggregate([{
				$sample: {size: quantity}
			}]).toArray();
			
			
			for (let _i = 0; _i < quantity; _i++) {
				docsToInsert.push({
					user: randomUsers[_i]._id,
					item: randomItems[_i]._id,
					quantity: generateRandomNumber(1, 100),
				})
			}
		};
		
		console.log( `  Inserting ${docsToInsert.length} documents to ${_colName}...` )
		await db.collection(_colName).insertMany(docsToInsert);
		console.log( "  OK" )
		
	};
	
	console.log( "Ended" )
	
};

(async() => {
	db = await mongoInit();
	populateMongo();
})();
