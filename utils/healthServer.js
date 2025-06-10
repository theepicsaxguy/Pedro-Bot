const http = require('http');
module.exports = () => {
  const port = process.env.HEALTH_PORT || 3000;
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, () => console.log(`[ℹ️] Health server on ${port}`));
};
