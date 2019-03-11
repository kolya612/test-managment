const Postgrator = require('postgrator');
const path = require('path');

const postgrator = new Postgrator({
  driver: 'pg',
  migrationDirectory: path.resolve(__dirname, '../migrations'),
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});
postgrator
    .migrate()
    .then(appliedMigrations => {
        if (!appliedMigrations.length) return;

        console.log('Applied migrations:');
        for (const migration of appliedMigrations) {
            console.log('-', migration.filename);
        }
    })
    .catch(error => {
        console.error('Migration failed:', error);
    });