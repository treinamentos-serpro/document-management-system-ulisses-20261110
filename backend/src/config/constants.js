const OWNER_HEADER = 'X-User-Id';
const DEFAULT_OWNER = 'anonimo';
// Letras (incluindo acentos), números, ponto, hífen, underline e @; até 64 caracteres.
const OWNER_PATTERN = /^[\p{L}\p{N}._@-]{1,64}$/u;

module.exports = {
  OWNER_HEADER,
  DEFAULT_OWNER,
  OWNER_PATTERN,
};
