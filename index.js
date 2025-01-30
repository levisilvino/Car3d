import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta dist (após build)
app.use(express.static(join(__dirname, 'dist')));
// Servir arquivos estáticos da pasta public
app.use(express.static(join(__dirname, 'public')));

// Rota para a página inicial
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Rota para a página sequence
app.get('/sequence', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'sequence.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});