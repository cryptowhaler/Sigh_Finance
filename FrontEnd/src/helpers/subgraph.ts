import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import config from '@/config';
import queries from '@/helpers/queries.json';

// handles querying data from balancer's Subgraph
export async function request(key: string | null, jsonQuery: any = {}) {
  jsonQuery = key ? merge( cloneDeep(queries[key]), cloneDeep(jsonQuery) ) : jsonQuery;
  console.log(jsonQuery);
  const query = typeof jsonQuery === 'string' ? jsonQuery: jsonToGraphQLQuery({ query: jsonQuery });
  console.log(query);
  // fetching data from Balancer's graph QL
  const res = await fetch(config.subgraphUrl, {
    method: 'POST',
    headers: {  Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const { data } = await res.json();
  console.log(data);
  return data;
}
