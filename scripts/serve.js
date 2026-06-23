#!/usr/bin/env node
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const port = Number.parseInt(process.env.PORT || '4173', 10);

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl || '/', `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const absolutePath = path.resolve(root, `.${requestedPath}`);

  if (!absolutePath.startsWith(`${root}${path.sep}`) && absolutePath !== root) {
    return null;
  }

  return absolutePath;
}

async function serveFile(requestUrl, response) {
  const filePath = resolveRequestPath(requestUrl);
  if (!filePath) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': mimeTypes.get(path.extname(filePath)) || 'application/octet-stream'
    });
    response.end(body);
  } catch (error) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Method not allowed');
    return;
  }

  void serveFile(request.url, response);
});

server.listen(port, () => {
  console.log(`Agent Tempo is available at http://localhost:${port}`);
});
