// Read-only, fictional API for visual inspection. Never connects to PostgreSQL.
import { createServer } from 'node:http';
import { serviceOperationsFixture } from './fixtures/service-operations.ts';
const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5199');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }
  if (request.method !== 'GET') { response.writeHead(405); response.end(); return; }
  const url = new URL(request.url || '/', 'http://127.0.0.1:5200');
  const data = serviceOperationsFixture(url.pathname.replace('/api/v1', ''), url.searchParams);
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ data, page: { total: Array.isArray(data) ? data.length : 1, offset: 0, limit: 100 } }));
});
server.listen(5200, '127.0.0.1', () => console.log('Fictional operations API ready on 5200'));
