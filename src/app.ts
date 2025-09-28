/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { Server } from 'http';
import { config } from './config/config.js';
import googleApp from './google/app.js';
import lineApp from './line/app.js';

const startServers = () => {
  const servers: Server[] = [];

  // Check for invalid providers
  const invalidProviders = config.enabledProviders.filter(provider =>
    !['google', 'line'].includes(provider)
  );

  if (invalidProviders.length > 0) {
    console.error(`❌ Invalid providers specified: ${invalidProviders.join(', ')}`);
    console.error('📋 Available providers: google, line');
    process.exit(1);
  }

  if (config.enabledProviders.includes('google')) {
    const googleServer = googleApp.listen(config.googlePort, config.host, () => {
      console.log(`🚀 GOOGLE OAuth Mock Server starting...`);
      console.log(`📍 URL: http://localhost:${config.googlePort}`);
      console.log('📋 Available endpoints:');
      console.log(`   - Authorization: http://localhost:${config.googlePort}/o/oauth2/v2/auth`);
      console.log(`   - Token: http://localhost:${config.googlePort}/token`);
      console.log(`   - User Info: http://localhost:${config.googlePort}/oauth2/v2/userinfo`);
      console.log(`   - Health Check: http://localhost:${config.googlePort}/health`);
    });
    servers.push(googleServer);
  }

  if (config.enabledProviders.includes('line')) {
    const lineServer = lineApp.listen(config.linePort, config.host, () => {
      console.log(`🚀 LINE OAuth Mock Server starting...`);
      console.log(`📍 URL: http://localhost:${config.linePort}`);
      console.log('📋 Available endpoints:');
      console.log(`   - Authorization: http://localhost:${config.linePort}/oauth2/v2.1/authorize`);
      console.log(`   - Token: http://localhost:${config.linePort}/oauth2/v2.1/token`);
      console.log(`   - User Info: http://localhost:${config.linePort}/v2/profile`);
      console.log(`   - Health Check: http://localhost:${config.linePort}/health`);
    });
    servers.push(lineServer);
  }

  if (servers.length === 0) {
    console.error('❌ No valid providers enabled');
    console.error('📋 Please specify providers using ENABLE environment variable (e.g., ENABLE=google,line)');
    process.exit(1);
  }

  console.log('');
  console.log('🛑 Press Ctrl+C to stop the servers');

  const shutdown = () => {
    console.log('🛑 Shutting down gracefully...');
    servers.forEach(server => {
      server.close(() => {
        console.log('✅ Server closed');
      });
    });
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  startServers();
}

export { googleApp, lineApp };
