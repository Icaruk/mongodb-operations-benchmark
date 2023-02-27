const { ObjectId } = require("mongodb");
const { performance, createHistogram } = require('node:perf_hooks');
const mongoInit = require("./mongoInit");
const bench = require('nanobench');


/** @type {import("mongodb").Db} */
let db;


const multipleQueries = async (userId, collectionSuffix) => {
	const orders = await db.collection(`orders_${collectionSuffix}`).find({
		user: new ObjectId(userId)
	}).toArray();
	
	let itemsToPopulate = new Set();
	orders.forEach( _x => itemsToPopulate.add( _x.item ) );
	itemsToPopulate = [...itemsToPopulate];
	
	const items = await db.collection(`items_${collectionSuffix}`).find({
		_id: { $in: itemsToPopulate }
	}).toArray();
	
	const users = await db.collection(`users_${collectionSuffix}`).find({
		_id: new ObjectId(userId)
	}).toArray();
	
	orders.forEach( _order => {
		const foundItem = items.find( _item => "" + _item._id === "" + _order.item );
		if (foundItem) {
			_order.item = foundItem
		};
		
		const foundUser = users.find( _user => "" + _user._id === "" + _order.user );
		if (foundUser) {
			_order.user = foundUser
		}
		
		return _order;
		
	});
	
	return orders;
};

const aggregateUnwind = async (userId, collectionSuffix) => {
	return await db.collection(`orders_${collectionSuffix}`).aggregate([
		{ $match: { user: new ObjectId(userId) } },
		{ $lookup: { from: "items", localField: "item", foreignField: "_id", as: "item" } },
		{ $unwind: "$item" },
		{ $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
		{ $unwind: "$user"},
	]).toArray();
};

const aggregateSetArrayElemAt = async (userId, collectionSuffix) => {
	return await db.collection(`orders_${collectionSuffix}`).aggregate([
		{ $match: { user: new ObjectId(userId) } },
		{ $lookup: { from: "items", localField: "item", foreignField: "_id", as: "item" } },
		{ $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
		{ $set: {
			item: { $arrayElemAt: ["$item", 0] },
			user: { $arrayElemAt: ["$user", 0] }
		}},
	]).toArray();
};


async function test({
	type,
	maxIterations = 1,
	collectionSuffix,
}) {
	
	// console.log( `*** Test ${type} for ${maxIterations} iterations on collection xxx_${collectionSuffix}  ***` )
	
	const testObj = {
		"multipleQueries": multipleQueries,
		"aggregateUnwind": aggregateUnwind,
		"aggregateSetArrayElemAt": aggregateSetArrayElemAt
	}
	const testFnc = testObj[type];
	
	const user = await db.collection(`users_${collectionSuffix}`).findOne({});
	const userId = user._id;
	
	// const histogram = createHistogram();
	
	for (let _i = 1; _i <= maxIterations; _i ++) {
		
		// performance.mark(`iteration_${_i}`); // testA_1, testA_2, ...
		// histogram.recordDelta();
		
		await testFnc(userId, collectionSuffix)
		
		// performance.mark(`iteration_${_i}`); // testA_1, testA_2, ...
		// histogram.recordDelta();
		
		process.stdout.write(`Iteration ${_i}/${maxIterations} \r`);
		
	};
	
	
	// const measure = performance.measure(`testA`, "iteration_1", `iteration_${maxIterations}`);
	
	
	// Convert nanoseconds to ms
	// const duration = measure.duration.toFixed(3);
	// const max = (histogram.max / 1e6).toFixed(3);
	// const min = (histogram.min / 1e6).toFixed(3);
	// const mean = (histogram.mean / 1e6).toFixed(3);
	// const percentile95 = (histogram.percentile(95) / 1e6).toFixed(3);
	
	// console.log("");
	// console.log("");
	// console.log( "-----------------------------------------" )
	// console.log( `TEST ${type}` )
	// console.log( `Iterations: ${maxIterations}` )
	// console.log(`Total: ${duration} ms`);
	// console.log( "-----------------------------------------" )
	// console.log( `Max: ${max} ms` )
	// console.log( `Min: ${min} ms` )
	// console.log( `Mean: ${mean} ms` )
	// console.log(`95th percentile: ${percentile95} ms`)
	// console.log( "-----------------------------------------" )
	
	// const perfEntries = performance.getEntriesByType("mark");
	// console.log(JSON.stringify(perfEntries, null, 2))
	
};



(async() => {
	
	db = await mongoInit();
	
	
	const testTypes = ["multipleQueries", "aggregateUnwind", "aggregateSetArrayElemAt"];
	const collectionSuffixes = [100, 1000, 10000];
	// users_100, users_1000, users_10000
	// items_100, items_1000, items_10000
	// orders_100, orders_1000, orders_10000
	
	const iterations = [50, 500, 5000];
	
	for await (let _testType of testTypes) {
		for await (let _collectionSuffix of collectionSuffixes) {
			for await (let _iteration of iterations) {
				bench(`${_testType} with collection size of ${_collectionSuffix} executed ${_iteration} times`, async  b => {
					b.start();
					
					await test({
						type: _testType,
						maxIterations: _iteration,
						collectionSuffix: _collectionSuffix,
					})
					
					b.end();
					
				})
			}
		}
	}
	
})();




