const newEngine = require('@comunica/actor-init-sparql').newEngine;
const readline = require('readline');
const fs = require('fs');

const myEngine = newEngine();

async function sparqlSelect() {
  let sources = [];
  const file = process.argv[2] || './sources/persons_1500';
  const probability = parseFloat(process.argv[3]) || 0.001;

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file)
  });

  readInterface.on('line', (line) => {
    sources.push({
      value: `http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/data/${line}`,
      context: {
        summary: `${__dirname}/summaries/${line}`,
        name: line,
        probability: probability
      }
    });
  });

  readInterface.on('close', () => {
    console.log(sources);
    // const result = await myEngine.query(`
    
    // `, {
    //   sources: sources
    // });

    // // let { data } = await myEngine.resultToString(result, 'stats');
    // let { data } = await myEngine.resultToString(result, 'table');
    // data.pipe(process.stdout);

    // result.bindingsStream.on('end', () => {
      
    // });

    // result.bindingsStream.on('error', (error) => {
    //   console.error(error);
    // });
  });
}

sparqlSelect();
