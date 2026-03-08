import datasource from './migrations-datasource';

datasource.initialize().then(async (ds) => {
  await ds.dropDatabase();
  await ds.runMigrations({
    transaction: 'all',
  });
});
