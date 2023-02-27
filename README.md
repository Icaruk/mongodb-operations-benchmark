# MongoDB operations benchmark

## Collections

users
```js
{
  name: string,
  last_name: string,
  email: string,
}
```

items
```js
{
  name: string,
  stock: number,
  price: number,
}
```

orders
```js
{
  user: ObjectId → user,
  item: ObjectId → item,
  quantity: number,
}
```

## Operations

multipleQueries
```js
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
```

aggregateUnwind
```js
const aggregateUnwind = async (userId, collectionSuffix) => {
	return await db.collection(`orders_${collectionSuffix}`).aggregate([
		{ $match: { user: new ObjectId(userId) } },
		{ $lookup: { from: "items", localField: "item", foreignField: "_id", as: "item" } },
		{ $unwind: "$item" },
		{ $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
		{ $unwind: "$user"},
	]).toArray();
};
```

aggregateSetArrayElemAt
```js
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
```

## Results
![Collection size_ 100](https://user-images.githubusercontent.com/10779469/221702221-ee3836b1-38c4-4400-846b-e7d91dcbdfa2.png)
![Collection size_ 1 000](https://user-images.githubusercontent.com/10779469/221702238-3906b4c3-c4cb-4407-b0b3-ca249466c8b2.png)
![Collection size_ 10 000](https://user-images.githubusercontent.com/10779469/221702371-7491492a-d90d-43a4-8a3b-d24592f508a9.png)




## Raw output

![image](https://user-images.githubusercontent.com/10779469/221702932-de495c11-be8b-4d8f-93b6-2e0bd4c3f480.png)


```
# multipleQueries with collection size of 100 executed 50 times
ok ~88 ms (0 s + 88348600 ns)

# multipleQueries with collection size of 100 executed 500 times
ok ~592 ms (0 s + 591941200 ns)

# multipleQueries with collection size of 100 executed 5000 times
ok ~4.3 s (4 s + 300954300 ns)

# multipleQueries with collection size of 1000 executed 50 times
ok ~63 ms (0 s + 63444700 ns)

# multipleQueries with collection size of 1000 executed 500 times
ok ~653 ms (0 s + 653103900 ns)

# multipleQueries with collection size of 1000 executed 5000 times
ok ~6.65 s (6 s + 645790500 ns)

# multipleQueries with collection size of 10000 executed 50 times
ok ~265 ms (0 s + 264711600 ns)

# multipleQueries with collection size of 10000 executed 500 times
ok ~2.75 s (2 s + 747458600 ns)

# multipleQueries with collection size of 10000 executed 5000 times
ok ~35 s (35 s + 406030600 ns)

# aggregateUnwind with collection size of 100 executed 50 times
ok ~45 ms (0 s + 45449600 ns)

# aggregateUnwind with collection size of 100 executed 500 times
ok ~275 ms (0 s + 275493700 ns)

# aggregateUnwind with collection size of 100 executed 5000 times
ok ~2.61 s (2 s + 610958700 ns)

# aggregateUnwind with collection size of 1000 executed 50 times
ok ~56 ms (0 s + 56369200 ns)

# aggregateUnwind with collection size of 1000 executed 500 times
ok ~526 ms (0 s + 526063100 ns)

# aggregateUnwind with collection size of 1000 executed 5000 times
ok ~5.24 s (5 s + 240187000 ns)

# aggregateUnwind with collection size of 10000 executed 50 times
ok ~254 ms (0 s + 254472900 ns)

# aggregateUnwind with collection size of 10000 executed 500 times
ok ~2.69 s (2 s + 694156300 ns)

# aggregateUnwind with collection size of 10000 executed 5000 times
ok ~29 s (28 s + 863781300 ns)

# aggregateSetArrayElemAt with collection size of 100 executed 50 times
ok ~66 ms (0 s + 66309500 ns)

# aggregateSetArrayElemAt with collection size of 100 executed 500 times
ok ~465 ms (0 s + 464602100 ns)

# aggregateSetArrayElemAt with collection size of 100 executed 5000 times
ok ~4.58 s (4 s + 583003200 ns)

# aggregateSetArrayElemAt with collection size of 1000 executed 50 times
ok ~77 ms (0 s + 77083300 ns)

# aggregateSetArrayElemAt with collection size of 1000 executed 500 times
ok ~636 ms (0 s + 636194400 ns)

# aggregateSetArrayElemAt with collection size of 1000 executed 5000 times
ok ~7.22 s (7 s + 215621900 ns)

# aggregateSetArrayElemAt with collection size of 10000 executed 50 times
ok ~212 ms (0 s + 212245700 ns)

# aggregateSetArrayElemAt with collection size of 10000 executed 500 times
ok ~2.13 s (2 s + 130429300 ns)

# aggregateSetArrayElemAt with collection size of 10000 executed 5000 times
ok ~20 s (20 s + 288887100 ns)
```

[GDrive link](https://docs.google.com/spreadsheets/d/11s8i3zAgKSGFNwTVmmDquo3fX2Ql8CV_0z8WWJtmGEg/edit?usp=sharing)
