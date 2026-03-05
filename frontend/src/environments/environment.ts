export const environment = {
  production: false,
  // URL del API Gateway (recomendado)
  gatewayUrl: 'http://localhost:5050/api',
  // URLs directas a microservicios (compatibilidad)
  apiUrl: 'http://localhost',
  usuariosApiUrl: 'http://localhost:5050/api', // Gateway: /api/auth/* y /api/users/*
  pedidosApiUrl: 'http://localhost:5050/api',  // Gateway: /api/orders/*
  pagosApiUrl: 'http://localhost:5050/api',    // Gateway: /api/payments/*
  jsonPlaceholderUrl: 'https://jsonplaceholder.typicode.com',
  // Habilitar Gateway (cambiar a false para usar microservicios directamente)
  useGateway: true
};
