const DBMigrate = require('db-migrate');
const GeoMigrator = require('@betagouvpdc/evolution-geo');
const InfraMigrator = require('@betagouvpdc/evolution-geo');

const instances = new Map();

async function createInstance(config) {
  const silent = !('APP_MIGRATOR_VERBOSE' in process.env);
  const instance = DBMigrate.getInstance(true, {
        config: { dev: config },
        cwd: __dirname,
        throwUncatched: true,
    });
    instance.silence(silent);
    await instance.registerAPIHook();
    return instance;
}

function getInstance(config) {
  return instances.get(JSON.stringify(config));
}

function setInstance(config, instance) {
  instances.set(JSON.stringify(config), instance);
  return instance;
}

async function migrate(config, skipGeoDatasets = true, skipInfraDatasets = true, ...args) {
    if(!('SKIP_GEO_MIGRATIONS' in process.env)) {
      const geoInstance = GeoMigrator.buildMigrator({
        pool: config,
        ...(
          skipGeoDatasets ? {
            app: {
              targetSchema: 'geo',
              datasets: [],
            },
          } : {}
        ),
      });
      await geoInstance.prepare();
      await geoInstance.run();
      await geoInstance.pool.end();
    }
    if(!('SKIP_INFRA_MIGRATIONS' in process.env)) {
      const infraInstance = InfraMigrator.buildMigrator({
        pool: config,
        ...(
          skipInfraDatasets ? {
            app: {
              targetSchema: 'infrastructures',
              datasets: [],
            },
          } : {}
        ),
      });
      await infraInstance.prepare();
      await infraInstance.run();
      await infraInstance.pool.end();
    }
    if(!('SKIP_SQL_MIGRATIONS' in process.env)) {
      const instance = getInstance(config) ?? setInstance(config, await createInstance(config));
      await instance.up(...args);
    }
}

async function createDatabase(config, name) {
    const instance = getInstance(config) ?? setInstance(config, await createInstance(config));
    return instance.createDatabase(name);
}

async function dropDatabase(config, name) {
    const instance = getInstance(config) ?? setInstance(config, await createInstance(config));
    return instance.dropDatabase(name);
}

module.exports = { migrate, createDatabase, dropDatabase };
