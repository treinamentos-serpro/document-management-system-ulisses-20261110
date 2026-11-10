// O prefixo /api é removido pelo proxy do Vite antes de chegar ao backend.
const API_PREFIX = '/api';
const GENERIC_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';
const CONNECTION_ERROR_MESSAGE = 'Não foi possível conectar ao servidor.';

async function readErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error || GENERIC_ERROR_MESSAGE;
  } catch {
    return GENERIC_ERROR_MESSAGE;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch {
    throw new Error(CONNECTION_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response;
}

// Sem dono informado, o backend usa o valor padrão "anonimo".
function ownerHeaders(owner) {
  return owner ? { 'X-User-Id': owner } : {};
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await request('/upload', {
    method: 'POST',
    headers: ownerHeaders(owner),
    body: formData,
  });
  return response.json();
}

export async function listDocuments(owner) {
  const response = await request('/documents', {
    headers: ownerHeaders(owner),
  });
  return response.json();
}

export async function downloadDocument(documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`);
  return response.blob();
}
