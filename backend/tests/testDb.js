const mongoose = require('mongoose');

const TEST_MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/warehouse_mgmt_test_db';

exports.connectTestDB = async () => {
  await mongoose.connect(TEST_MONGO_URI);
};

exports.closeTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

exports.clearCollections = async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};
