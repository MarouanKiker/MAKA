const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8000';

module.exports = {
  '/api': {
    target: gatewayUrl,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn'
  }
};
