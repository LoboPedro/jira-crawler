require('dotenv').config();
const axios = require('axios');
const { MongoClient } = require('mongodb');

process.env.TZ = 'America/Belem';

const username = process.env.JIRA_USERNAME; 
const token = process.env.JIRA_TOKEN;
const auth = 'Basic ' + Buffer.from(username + ':' + token).toString('base64');
const baseUrl = process.env.JIRA_URL;
const maxResults = 100; 

const mongoUrl = process.env.MONGO_URL;
const dbName = 'jira-crawler';
const client = new MongoClient(mongoUrl);

if (!username || !token || !baseUrl || !mongoUrl) {
  console.error("Erro: Variáveis de ambiente ausentes. Verifique o arquivo .env");
  process.exit(1);
}

async function connectMongo() {
  try {
    await client.connect();
    console.log(`## Conectado ao banco ${dbName} ##\n------------------------------>`);
  } catch (err) {
    console.error('ERRO AO CONECTAR AO BANCO:', err);
    process.exit(1);
  }
}

async function jiraCrawler() {
  try {
    const db = client.db(dbName);
    const collectionJql = db.collection('jira_jql');
    const jqlData = await collectionJql.find({}).toArray();

    for (const doc of jqlData) {
      const fields = Object.keys(doc);
      if (fields.length > 1) {
        const jqlQuery = doc[fields[1]]; 

        console.log(`Buscando dados para JQL: ${jqlQuery}\n----------------------------------------------------------------`);

        let startAt = 0;
        let total = 1;
        let allIssues = [];

        while (startAt < total) {
          try {
            const response = await axios.get(baseUrl, {
              headers: {
                'Authorization': auth,
                'Accept': 'application/json'
              },
              params: {
                jql: jqlQuery,
                startAt,
                maxResults
              }
            });

            const data = response.data;
            allIssues = allIssues.concat(data.issues);
            total = data.total;
            startAt += maxResults;

            console.log(`Buscando issues: ${startAt}/${total}`);
          } catch (error) {
            console.error('Erro na requisição Jira:', error.response ? error.response.data : error.message);
            ;
          }
        }

        console.log(`\nTotal de issues coletadas para JQL ${jqlQuery}: ${allIssues.length}`);

        const collectionName = fields[1];
        const collectionIssues = db.collection(collectionName);

        await collectionIssues.deleteMany({});
        console.log(`\nColeção ${collectionName} limpa`);

        const issuesToInsert = allIssues.map(issue => {
          const {
            id,
            key,
            fields: {
              issuetype,
              priority,
              status,
              summary,
              reporter,
              assignee,
              created,
              updated
            }
          } = issue;

          const formattedCreated = formatDate(created);
          const formattedUpdated = formatDate(updated);

          return {
            issue_id: id,
            Chave: key,
            summary,
            TipoRequisicao: issuetype.name,
            Relator: reporter ? reporter.displayName : null,
            Responsavel: assignee ? assignee.displayName : null,
            Prioridade: priority ? priority.name : null,
            Status: status.name,
            Criado: formattedCreated,
            Atualizado: formattedUpdated,
            InseridoEm: new Date().toString()
          };
        });

        await collectionIssues.insertMany(issuesToInsert);
        console.log(`#-#------------------------------------------------------------------#-#`);
        console.log(`#-#-Processo de inserção para a coleção ${collectionName} concluído.-#-#`);
        console.log(`#-#------------------------------------------------------------------#-#`);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar dados da coleção jql_produtividade:', err);
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

connectMongo().then(() => {
  jiraCrawler();
});

setInterval(jiraCrawler, 1800000);