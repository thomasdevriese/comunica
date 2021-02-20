const newEngine = require('@comunica/actor-init-sparql').newEngine;
const readline = require('readline');
const fs = require('fs');

const myEngine = newEngine();

async function init() {
  let sources = [];
  const file = process.argv[2] || './sources/SF_0.1_filepaths.txt';
  const probability = parseFloat(process.argv[3]) || 0.001;
  const baseUrl = 'http://192.168.1.55:3000';

  const query = `
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  PREFIX sn: <${baseUrl}/www.ldbc.eu/ldbc_socialnet/1.0/data/>
  PREFIX snvoc: <${baseUrl}/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
  PREFIX sntag: <${baseUrl}/www.ldbc.eu/ldbc_socialnet/1.0/tag/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX dbpedia: <${baseUrl}/dbpedia.org/resource/>
  PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>

  SELECT * WHERE {
    ?person snvoc:isLocatedIn ?city .
    ?city foaf:name "Brussels" .
  }
  `;

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file)
  });

  const patternPath = /out-fragments\/http\/192\.168\.1\.55_3000\/(.*).nq/;
  const patternName = /\/([^\/]+)\.nq/;
  let counter = 0;
  readInterface.on('line', (line) => {
    const matchesPath = line.match(patternPath);
    const matchesName = line.match(patternName);
    sources.push({
      value: `${baseUrl}/${matchesPath[1]}`,
      context: {
        summary: `${__dirname}/summaries/${matchesName[1]}`,
        name: matchesName[1],
        probability: probability
      }
    });
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`Source ${++counter} pushed into array`);
  });

  readInterface.on('close', () => {
    console.log(sources);
    // executeQuery(query, sources);
  });
}

async function executeQuery(query, sources) {
  const result = await myEngine.query(query, {
    sources: sources
  });

  // let { data } = await myEngine.resultToString(result, 'stats');
  let { data } = await myEngine.resultToString(result, 'table');
  data.pipe(process.stdout);

  result.bindingsStream.on('end', () => {
    
  });

  result.bindingsStream.on('error', (error) => {
    console.error(error);
  });
}

init();
