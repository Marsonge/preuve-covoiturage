import { buildMigrator } from '@betagouvpdc/evolution-geo';
import { PoolConfig } from 'pg';
import axios from 'axios';
import { CreateBlncTable } from './datastructures/001_CreateBnlcTable';
import { bnlc } from './datasets/bnlc';

const lastBnlcUrl = async (url: string) => {
  const response = await axios.get(url);
  const bnlcUrl = response.data.history[0].payload.permanent_url;
  return bnlcUrl;
}

export async function migrate(config:PoolConfig) {
  const bnlcUrl = await lastBnlcUrl('https://transport.data.gouv.fr/api/datasets/5d6eaffc8b4c417cdc452ac3');
  const datasets = new Set([bnlc(bnlcUrl)]);
  const datastructures = new Set([CreateBlncTable]);
  if(!('SKIP_ETL_MIGRATIONS' in process.env)) {
    const instance = buildMigrator({
      pool: config,
      app: {
        targetSchema: 'infrastructures',
        datasets: datasets,
        datastructures: datastructures
      }
    });
    await instance.prepare();
    await instance.run();
    await instance.pool.end();
  }
}

