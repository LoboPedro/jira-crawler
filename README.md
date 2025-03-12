# Jira Crawler

Este projeto é um crawler que busca issues do Jira com base em JQLs salvas em um banco de dados MongoDB e as armazena em coleções separadas.

## Requisitos

Antes de rodar o projeto, certifique-se de ter os seguintes requisitos atendidos:

- Node.js instalado
- Banco de dados MongoDB disponível
- Conta no Jira com API Token
- Arquivo `.env` configurado corretamente

## Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto e configure as variáveis de ambiente:

```ini
JIRA_USERNAME=seu_usuario
JIRA_TOKEN=seu_token
JIRA_URL=https://seu_jira.atlassian.net/rest/api/3/search
JIRA_FIELDS=issuetype,priority,key,status,summary,reporter,assignee,created,updated
MONGO_URL=mongodb://seu_mongo
```

## Instalação

1. Clone este repositório:
   ```sh
   git clone https://github.com/LoboPedro/jira-crawler.git
   ```
2. Acesse a pasta do projeto:
   ```sh
   cd jira-crawler
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```

## Como Funciona

1. O script se conecta ao MongoDB e busca as JQLs salvas na coleção `jira_jql`.
2. Para cada JQL, ele consulta a API do Jira em lotes de `maxResults` (padrão: 100).
3. Os dados são armazenados em coleções separadas no MongoDB, onde o nome da coleção corresponde ao nome do campo que contém a JQL.
4. Antes de inserir novos dados, a coleção correspondente é limpa para evitar duplicação.
5. O script roda automaticamente a cada 30 minutos (`setInterval(jiraCrawler, 1800000);`).

## Execução

Para rodar o projeto manualmente:

```sh
node jira-crawler.js
```

## Estrutura do Código

- **Configuração**: O script carrega variáveis de ambiente do `.env`.
- **Autenticação**: Gera um token `Basic Auth` para acessar a API do Jira.
- **Conexão com MongoDB**: Estabelece a conexão e recupera as JQLs armazenadas.
- **Coleta de Dados**: Busca os issues da API do Jira usando paginação.
- **Armazenamento**: Salva os issues no MongoDB com formatação padronizada.
- **Execução Programada**: O script é executado automaticamente a cada 30 minutos.

## Exemplo de JQL no Banco

A coleção `jira_jql` no MongoDB deve conter documentos como este:

```json
{
  "_id": "65234ab12d3f4b12c67890ab",
  "nome_projeto": "project = XYZ AND status = 'Em Progresso'"
}
```

A JQL será usada para buscar issues e a coleção `nome_projeto` será criada no MongoDB para armazenar os dados.

## Formato dos Dados Armazenados

Cada issue armazenada no MongoDB terá o seguinte formato:

```json
{
  "issue_id": "10001",
  "Chave": "XYZ-123",
  "summary": "Corrigir erro na API",
  "TipoRequisicao": "Bug",
  "Relator": "João Silva",
  "Responsavel": "Maria Souza",
  "Prioridade": "Alta",
  "Status": "Em Progresso",
  "Criado": "12-03-2025 14:35:22",
  "Atualizado": "14-03-2025 10:20:45",
  "InseridoEm": "Sat Mar 15 2025 12:00:00 GMT-0300"
}
```

## Logs e Debug

O script imprime mensagens de log para acompanhar o progresso, incluindo:

- Conexão com o banco de dados
- JQLs processadas
- Status da busca por issues
- Limpeza e inserção de dados nas coleções
- Erros de conexão e requisição

## Sugestão de Melhorias 

- Implementar o CRUD completo para gerenciar as JQLs na interface WEB
- Implementar autenticação por JWT
- Melhorar o processo de inserção no Banco


