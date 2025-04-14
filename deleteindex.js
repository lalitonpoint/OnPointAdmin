const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://onpointlogistics688:vAfVPAi5d5e2Wl7b@cluster0.mcl2w.mongodb.net/onpoint?retryWrites=true&w=majority'; // Change if needed

(async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const coll of collections) {
            const collectionName = coll.name;
            const collection = mongoose.connection.db.collection(collectionName);

            // Skip _id index drop if you want, or drop all including _id
            const indexes = await collection.indexes();

            for (const index of indexes) {
                if (index.name !== '_id_') {
                    console.log(`Dropping index "${index.name}" on collection "${collectionName}"`);
                    await collection.dropIndex(index.name);
                }
            }
        }

        console.log('✅ All non-_id indexes deleted successfully');
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error while dropping indexes:', err);
        process.exit(1);
    }
})();
