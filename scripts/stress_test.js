const autocannon = require('autocannon');

const API_BASE_URL = 'http://localhost:5263/api';

const token = process.argv[2];

if (!token) {
  console.error('Por favor, passe o Bearer Token como argumento.');
  console.error('Ex: node stress_test.js "eyJhb..."');
  process.exit(1);
}

const run = () => {
  const instance = autocannon({
    url: `${API_BASE_URL}/veiculos`, // Ponto crítico: lista todos os veículos
    connections: 100, // Número de conexões simultâneas (100 gerentes)
    pipelining: 1,
    duration: 10, // Duração do teste em segundos
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log('\n--- RESULTADOS DO TESTE DE STRESS ---');
    console.log(`URL: ${result.url}`);
    console.log(`Duração: ${result.duration} segundos`);
    console.log(`Conexões: ${result.connections}`);
    console.log(`Total de Requisições: ${result.requests.total}`);
    console.log(`Média de Requisições/seg (RPS): ${result.requests.average}`);
    console.log(`Latência Média: ${result.latency.average} ms`);
    console.log(`Máxima Latência: ${result.latency.max} ms`);
    console.log(`Requisições c/ Erro (Não 2xx): ${result.non2xx}`);
    
    if (result.non2xx > 0) {
        console.warn('ALERTA: A API não conseguiu lidar com algumas requisições ou travou (Erros 500/Timeout).');
    }
  });
};

run();
