// Rotas inexistentes também respondem no formato { error }.
function notFound(req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

// Último middleware: converte qualquer erro não tratado em resposta { error }.
// O parâmetro next é obrigatório para o Express reconhecer o handler de erro.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corpo da requisição em JSON inválido.' });
  }

  const status = error.status || error.statusCode || 500;
  if (status >= 500) {
    console.error('Erro não tratado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }

  const message = error.expose ? error.message : 'Requisição inválida.';
  return res.status(status).json({ error: message });
}

module.exports = {
  notFound,
  errorHandler,
};
