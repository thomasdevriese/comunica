/*

USAGE: node experiment [number_of_persons[_locations]] [probability] [query]

*/

const newEngine = require('@comunica/actor-init-sparql').newEngine;
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

const myEngine = newEngine();
let startUsage;
let startTime;
let executionStart;

async function init() {
  // Init metrics
  startTime = Date.now();
  startUsage = process.cpuUsage();
  executionStart = process.hrtime();

  let sources = [];
  const numberOfPersons = process.argv[2] || '10'; // if datasources containing locations must be included, provide '<numberOfPersons>_locations' as argument
  const file = path.join('C:\\Users\\thoma\\Documents\\Master\\Masterproef\\Implementatie\\experiments\\ldbc-snb-decentralized',`persons_${numberOfPersons}_filepaths.txt`);
  const probability = process.argv[3] ?  parseFloat(process.argv[3]) : 0.001;
  const baseUrl = 'http://localhost:3000';

  const prefixes = `
  PREFIX snvoc: <${baseUrl}/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n`;

  const query = process.argv[4] ||
  `SELECT ?person WHERE 
  {
    ?person snvoc:firstName "Tom" .
  }
  `;
  const sparqlQuery = prefixes.concat(query);

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file)
  });

  const patternPath = /out-fragments\/http\/localhost_3000\/(.*).nq/;
  const patternName = /\/([^\/]+)\.nq/;
  readInterface.on('line', (line) => {
    const matchesPath = line.match(patternPath);
    const matchesName = line.match(patternName);
    sources.push({
      value: `${baseUrl}/${matchesPath[1]}`,
      context: {
        summary: path.join(`C:\\Users\\thoma\\Documents\\Master\\Masterproef\\Implementatie\\amf\\summaries_SF_0.3`, matchesName[1]),
        name: matchesName[1],
        probability: probability
      }
    });
  });

  readInterface.on('close', () => {
    executeQuery(sparqlQuery, sources);
  });
}

async function executeQuery(sparqlQuery, sources) {
  const result = await myEngine.query(sparqlQuery, {
    sources: sources
  });

  let { data } = await myEngine.resultToString(result, 'stats');
  // let { data } = await myEngine.resultToString(result, 'table');
  data.pipe(process.stdout);

  data.on('end', () => {
    // Print metrics
    const executionEnd = process.hrtime(executionStart);
    console.log(`|\t|\t|\t\tQuery execution time: ${(executionEnd[0] + executionEnd[1]/1e9).toFixed(3)}s`);
    const endTime = Date.now();
    const cpuUsage = process.cpuUsage(startUsage);
    const cpuPercentage = 100 * ((cpuUsage.user + cpuUsage.system)/os.cpus().length) /
      ((endTime - startTime) * 1000);
    console.log(`|\t|\t|\t\tCPU load: ${cpuPercentage.toFixed(2)}%`);
    const memory = process.memoryUsage();
    console.log(`|\t|\t|\t\tMemory usage: ${(memory.rss/1024/1024).toFixed(2)} MB\n|\t|\t|`);
  });

  data.on('error', (error) => {
    console.error(error);
  });
}

init();
