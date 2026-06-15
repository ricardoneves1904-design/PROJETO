# Projeto Final - Desenvolvimento de Software

## 1. Objetivo do projeto

O objetivo do projeto final é desenvolver uma pequena aplicação web completa, com:

- frontend em HTML, CSS e JavaScript;
- backend em Node.js com Express;
- API REST;
- ligação a uma base de dados MySQL;
- operações CRUD;
- validação de dados;
- instruções claras para instalar, configurar e correr o projeto.

O projeto deve demonstrar os conteúdos trabalhados nas UC00604 e UC00605: JavaScript, Node.js, Express, rotas, middlewares, frontend com `fetch`, DOM, MySQL e integração entre frontend, backend e base de dados.

## 2. Tema do projeto

Cada formando ou grupo pode escolher o tema da aplicação, desde que exista uma entidade principal com dados guardados numa base de dados.

Exemplos de temas possíveis:

- biblioteca de músicas;
- lista de livros;
- gestão de filmes ou séries;
- agenda de marcações;
- gestão de tarefas;
- catálogo de produtos;
- lista de clientes;
- gestão de eventos;
- coleção de jogos;
- registo de receitas.

O tema pode ser simples. O mais importante é a aplicação estar bem estruturada e funcionar de ponta a ponta.

## 3. Requisitos mínimos obrigatórios

### 3.1. Base de dados

O projeto deve usar MySQL.

É obrigatório existir pelo menos uma tabela principal com:

- `id` numérico com auto incremento;
- pelo menos 4 campos adicionais;
- pelo menos um campo de texto;
- pelo menos um campo numérico, booleano ou data;
- dados que façam sentido para o tema escolhido.

Exemplo para músicas:

```sql
id
titulo
artista
genero
ano
favorita
```

O formando pode usar uma das seguintes opções:

- `mysql2`, escrevendo queries SQL manualmente;
- Prisma, usando `schema.prisma` e Prisma Client.

Não é obrigatório usar as duas opções. Basta escolher uma e conseguir explicar a escolha.

### 3.2. Backend com Express

O backend deve ter um servidor Express funcional.

Requisitos mínimos:

- usar `express`;
- usar `express.json()` para receber dados em JSON;
- usar variáveis de ambiente com `.env`;
- ter ligação funcional à base de dados MySQL;
- ter rotas organizadas e testáveis;
- devolver respostas em JSON;
- usar códigos HTTP adequados;
- tratar erros principais.

Rotas mínimas obrigatórias:

```txt
GET    /api/estado
GET    /api/recurso
GET    /api/recurso/:id
POST   /api/recurso
PUT    /api/recurso/:id
DELETE /api/recurso/:id
```

O nome `recurso` deve ser substituído pelo tema do projeto.

Exemplos:

```txt
GET    /api/musicas
POST   /api/musicas
PUT    /api/musicas/1
DELETE /api/musicas/1
```

Também é aceite uma rota `PATCH` se fizer sentido para alterar apenas um campo.

Exemplo:

```txt
PATCH /api/musicas/1/favorita
```

### 3.3. Validação de dados

O projeto deve validar os dados recebidos no backend antes de guardar na base de dados.

Validações mínimas:

- campos obrigatórios não podem estar vazios;
- números devem ser números válidos;
- textos devem ter tamanho razoável;
- o backend deve responder com erro `400` quando os dados são inválidos.

Exemplo de resposta em caso de erro:

```json
{
  "erro": "O titulo e obrigatorio."
}
```

Ou, se forem acumulados vários erros:

```json
{
  "erros": [
    "O titulo e obrigatorio.",
    "O ano deve ser um numero valido."
  ]
}
```

As duas abordagens são aceites. Para projetos mais simples, podem devolver logo o primeiro erro encontrado.

### 3.4. Frontend

O projeto deve ter uma interface web simples, feita com HTML, CSS e JavaScript.

Requisitos mínimos:

- ficheiro `index.html`;
- ficheiro `styles.css`;
- ficheiro `app.js`;
- formulário para criar registos;
- listagem dos registos vindos da base de dados;
- botões para apagar registos;
- possibilidade de editar registos ou alterar pelo menos um estado simples;
- uso de `fetch` para comunicar com a API;
- uso do DOM para ler campos, mostrar dados e reagir a eventos;
- mensagens simples de sucesso ou erro.

O frontend deve substituir o uso básico do Postman nas operações principais.

### 3.5. Integração frontend-backend

O frontend deve conseguir comunicar com o backend.

Existem duas formas aceites:

1. Servir o frontend pelo próprio Express com `express.static`.
2. Correr o frontend com Live Server noutra porta e ativar `cors` no backend.

Se o frontend for servido pelo Express, o `fetch` pode usar caminho relativo:

```js
const API_URL = "/api/musicas";
```

Se o frontend estiver no Live Server, o `fetch` deve usar o endereço completo do backend:

```js
const API_URL = "http://localhost:3000/api/musicas";
```

O projeto não deve ser testado abrindo o `index.html` diretamente com `file://`, porque isso pode causar erros de CORS e de origem no browser.

## 4. Requisitos técnicos

O projeto deve incluir:

- `package.json`;
- scripts para correr o projeto;
- `.env.example`;
- ficheiro SQL da base de dados ou ficheiros Prisma;
- frontend separado numa pasta própria;
- código comentado apenas nas partes mais importantes;
- nomes de variáveis claros;
- README com instruções de instalação e execução.

Exemplo de scripts mínimos:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

Se o projeto usar Prisma, pode incluir também:

```json
{
  "scripts": {
    "prisma:validate": "prisma validate",
    "prisma:push": "prisma db push",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

## 5. Entrega obrigatória

O projeto deve ser entregue numa pasta ou repositório com todos os ficheiros necessários para instalar, configurar e testar a aplicação noutro computador.

### 5.1. Entrega da base de dados

A base de dados não é entregue como "programa MySQL". O MySQL fica instalado no computador de cada pessoa. O que se entrega é um ficheiro que permite recriar a base de dados noutro computador.

Para projetos com `mysql2`, devem entregar um ficheiro `database.sql` com:

- criação da base de dados, se possível;
- criação das tabelas;
- alguns dados de exemplo com `INSERT`;
- estrutura suficiente para o professor conseguir importar e testar.

Exemplo simples:

```sql
CREATE DATABASE IF NOT EXISTS musicas_aula_db;
USE musicas_aula_db;

CREATE TABLE IF NOT EXISTS musica (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  artista VARCHAR(200) NOT NULL,
  genero VARCHAR(50) NOT NULL,
  ano INT NOT NULL,
  favorita BOOLEAN DEFAULT false
);

INSERT INTO musica (titulo, artista, genero, ano, favorita)
VALUES ("Imagine", "John Lennon", "Rock", 1971, false);
```

No MySQL Workbench, uma forma simples de gerar este ficheiro é:

1. Abrir o MySQL Workbench.
2. Ir a `Server > Data Export`.
3. Escolher a base de dados do projeto.
4. Selecionar `Dump Structure and Data`.
5. Escolher `Export to Self-Contained File`.
6. Guardar como `database.sql`.
7. Clicar em `Start Export`.

Para importar noutro computador:

1. Abrir o MySQL Workbench.
2. Ir a `Server > Data Import`.
3. Escolher `Import from Self-Contained File`.
4. Selecionar o ficheiro `database.sql`.
5. Clicar em `Start Import`.

Também é possível fazer a exportação pelo terminal:

```bash
mysqldump -u root -p nome_da_base_de_dados > database.sql
```

Para importar pelo terminal:

```bash
mysql -u root -p < database.sql
```

Para projetos com Prisma, devem entregar:

- `prisma/schema.prisma`;
- `prisma.config.ts`, se existir;
- pasta de migrations, se tiverem usado migrations;
- ou instruções para correr `npx prisma db push`;
- dados de exemplo em `database.sql`, `seed.js` ou explicados no README.

Mesmo usando Prisma, continua a ser útil entregar um pequeno `database.sql` com dados de exemplo, porque facilita a correção.

### 5.2. Estrutura mínima da entrega

```txt
nome-do-projeto/
  frontend/
    index.html
    styles.css
    app.js
  server.js
  package.json
  package-lock.json
  .env.example
  README.md
  database.sql
```

Se for usado Prisma, a estrutura pode ser:

```txt
nome-do-projeto/
  frontend/
    index.html
    styles.css
    app.js
  prisma/
    schema.prisma
  generated/
  prisma.config.ts
  server.js
  package.json
  package-lock.json
  .env.example
  README.md
```

Não devem ser entregues:

- pasta `node_modules`;
- ficheiro `.env` com passwords reais;
- ficheiros temporários do sistema;
- versões duplicadas que confundam a execução do projeto.

## 6. README obrigatório

O `README.md` deve explicar:

- nome do projeto;
- objetivo da aplicação;
- tecnologias usadas;
- como criar/importar a base de dados;
- como configurar o `.env`;
- como instalar dependências;
- como correr o backend;
- como abrir o frontend;
- lista das rotas da API;
- exemplos simples de utilização.

Exemplo de comandos:

```bash
npm install
npm run dev
```

Se usar Prisma:

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma db push
npm run dev
```

## 7. Critérios de avaliação 

| Critério | Peso |
| --- | ---: |
| Base de dados bem definida e funcional | 20% |
| API REST com CRUD completo | 25% |
| Integração correta com MySQL | 15% |
| Frontend funcional com `fetch` e DOM | 20% |
| Validação, erros e códigos HTTP | 10% |
| Organização, README e apresentação | 10% |

## 8. Funcionalidades extra

As seguintes funcionalidades não são obrigatórias, mas podem valorizar o projeto:

- pesquisa por texto;
- filtro por categoria, género, estado ou data;
- ordenação;
- contadores ou estatísticas;
- confirmação antes de apagar;
- modo editar no frontend;
- rota `PATCH` para alterar apenas um campo;
- página de detalhes;
- tratamento visual de loading e erros;
- Prisma Studio para consultar dados;
- deploy local bem documentado.

Login/autenticação não é requisito mínimo. Só deve ser feito se houver tempo e se o formando já dominar bem rotas, formulários, `fetch`, sessões ou tokens.

## 9. Checklist de teste antes da entrega

Antes de entregar, o formando deve confirmar:

- `npm install` funciona numa pasta limpa;
- o `.env` tem todas as variáveis necessárias;
- a base de dados existe no MySQL;
- as tabelas foram criadas corretamente;
- o backend arranca sem erros;
- a rota `/api/estado` responde;
- a rota de listagem responde;
- é possível criar um registo pelo frontend;
- é possível listar dados vindos da base de dados;
- é possível apagar um registo;
- é possível editar ou alterar algum estado;
- erros de validação aparecem quando os dados são inválidos;
- o projeto não depende do Postman para ser usado;
- o projeto não foi entregue com `node_modules`;
- o projeto não foi entregue com passwords reais no `.env`.

## 10. Problemas comuns a evitar

- Backend e frontend em portas diferentes sem `cors`.
- `fetch("/api/...")` usado no Live Server, chamando a porta errada.
- Abrir o HTML diretamente com `file://`.
- Base de dados com nome diferente do `.env`.
- MySQL desligado.
- Password errada no `.env`.
- Esquecer `npm install`.
- Esquecer `npx prisma generate` quando se usa Prisma.
- Usar `@prisma/client` sem o cliente estar gerado.
- Não usar `await` nas queries assíncronas.
- Não validar dados antes de gravar.
- Apagar registos sem confirmação no frontend.
- Entregar código que só funciona no computador do formando por causa de caminhos absolutos.

## 11. Demonstração final

Na apresentação, o formando deve conseguir mostrar:

1. A base de dados no MySQL Workbench.
2. O backend a correr no terminal.
3. A rota `/api/estado` a responder.
4. O frontend aberto no browser.
5. Criar um registo pelo frontend.
6. Ver o registo aparecer na base de dados.
7. Alterar ou editar um registo.
8. Apagar um registo.
9. Explicar rapidamente a estrutura do projeto.

O objetivo da demonstração não é decorar código. O objetivo é provar que o formando compreende o percurso completo: browser, frontend, API, backend, base de dados e resposta ao utilizador.
