const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = STORAGE_DIR;
process.env.MAX_FILE_SIZE = '1024';

const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(STORAGE_DIR, { recursive: true, force: true });
});

function buildUploadForm(content, fileName = 'contrato.txt', mimeType = 'text/plain') {
  const form = new FormData();
  form.append('file', new Blob([content], { type: mimeType }), fileName);
  return form;
}

async function uploadFile(content, { owner, fileName, mimeType } = {}) {
  const headers = owner ? { 'X-User-Id': owner } : {};
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: buildUploadForm(content, fileName, mimeType),
  });
}

test('POST /upload grava o arquivo e retorna 201 com metadados', async () => {
  const response = await uploadFile('conteudo do contrato', { fileName: 'contrato.txt' });
  assert.strictEqual(response.status, 201);

  const metadata = await response.json();
  assert.match(metadata.id, /^[0-9a-f-]{36}$/);
  assert.strictEqual(metadata.originalName, 'contrato.txt');
  assert.strictEqual(metadata.size, Buffer.byteLength('conteudo do contrato'));
  assert.strictEqual(metadata.owner, 'anonimo');
  assert.ok(!Number.isNaN(Date.parse(metadata.uploadedAt)));
  assert.strictEqual(metadata.storedName, undefined, 'storedName não deve ser exposto');
});

test('POST /upload associa o documento ao dono informado em X-User-Id', async () => {
  const response = await uploadFile('dados', { owner: 'maria' });
  assert.strictEqual(response.status, 201);
  assert.strictEqual((await response.json()).owner, 'maria');
});

test('POST /upload preserva o nome original com acentos (UTF-8)', async () => {
  const response = await uploadFile('acentos', { fileName: 'ação contrato.txt' });
  assert.strictEqual(response.status, 201);
  assert.strictEqual((await response.json()).originalName, 'ação contrato.txt');
});

test('POST /upload sem o campo file retorna 400', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: new FormData(),
  });
  assert.strictEqual(response.status, 400);
  assert.match((await response.json()).error, /file/);
});

test('POST /upload com arquivo acima de MAX_FILE_SIZE retorna 413', async () => {
  const response = await uploadFile('x'.repeat(2048));
  assert.strictEqual(response.status, 413);
  assert.ok((await response.json()).error);
});

test('GET /documents lista somente os documentos do dono informado', async () => {
  await uploadFile('lista-a', { owner: 'listagem-user', fileName: 'a.txt' });
  await uploadFile('lista-b', { owner: 'outro-user', fileName: 'b.txt' });

  const response = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'listagem-user' },
  });
  assert.strictEqual(response.status, 200);

  const documents = await response.json();
  assert.ok(Array.isArray(documents));
  assert.ok(documents.length >= 1);
  documents.forEach((document) => {
    assert.strictEqual(document.owner, 'listagem-user');
    assert.strictEqual(document.storedName, undefined);
  });
});

test('GET /documents sem X-User-Id usa o dono padrão anonimo', async () => {
  const response = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(response.status, 200);
  const documents = await response.json();
  documents.forEach((document) => assert.strictEqual(document.owner, 'anonimo'));
});

test('GET /documents/:id/download devolve os bytes idênticos ao upload', async () => {
  const content = 'conteúdo binário de teste\n';
  const uploaded = await (await uploadFile(content, {
    fileName: 'relatorio.txt',
    mimeType: 'text/plain',
  })).json();

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);
  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), content);
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.match(response.headers.get('content-disposition'), /^attachment/);
  assert.match(response.headers.get('content-disposition'), /relatorio\.txt/);
});

test('GET /documents/:id/download com id inexistente retorna 404', async () => {
  const response = await fetch(`${baseUrl}/documents/nao-existe/download`);
  assert.strictEqual(response.status, 404);
  assert.match((await response.json()).error, /não encontrado/);
});

test('GET /documents/:id/download retorna 404 quando o arquivo sumiu do disco', async () => {
  const uploaded = await (await uploadFile('temporario')).json();
  fs.readdirSync(STORAGE_DIR).forEach((name) => fs.rmSync(path.join(STORAGE_DIR, name)));

  const response = await fetch(`${baseUrl}/documents/${uploaded.id}/download`);
  assert.strictEqual(response.status, 404);
});
