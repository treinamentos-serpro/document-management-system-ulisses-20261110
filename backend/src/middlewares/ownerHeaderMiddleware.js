const { OWNER_HEADER, OWNER_PATTERN } = require('../config/constants');

// Valida o formato de X-User-Id antes de qualquer gravação. Ausência ou valor vazio usam o dono padrão.
function validateOwnerHeader(req, res, next) {
  const owner = (req.get(OWNER_HEADER) || '').trim();
  if (owner && !OWNER_PATTERN.test(owner)) {
    return res.status(400).json({
      error: `${OWNER_HEADER} inválido: use de 1 a 64 letras, números, ponto, hífen, underline ou @.`,
    });
  }
  return next();
}

module.exports = {
  validateOwnerHeader,
};
