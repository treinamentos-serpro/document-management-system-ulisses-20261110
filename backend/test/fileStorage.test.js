const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { STORAGE_DIR } = require('../src/config/env');
const { resolveFilePath } = require('../src/repositories/fileStorage');

test('resolveFilePath monta o caminho dentro do diretório de armazenamento', () => {
  assert.strictEqual(
    resolveFilePath('arquivo-123'),
    path.join(STORAGE_DIR, 'arquivo-123'),
  );
});

test('resolveFilePath rejeita nomes que escapam do diretório (path traversal)', () => {
  assert.strictEqual(resolveFilePath('../segredo.txt'), null);
  assert.strictEqual(resolveFilePath(path.join('..', 'outra-pasta', 'x')), null);
  assert.strictEqual(resolveFilePath(path.resolve('/etc/passwd')), null);
});
