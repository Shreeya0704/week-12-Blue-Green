const http = require("http");
const PORT = process.env.PORT || 3000;
const COLOR = process.env.COLOR || "blue";
const server = http.createServer((req, res) => {
  res.writeHead(200, {"Content-Type":"text/plain"});
  res.end(`Hello from ${COLOR} at ${new Date().toISOString()}\n`);
});
server.listen(PORT, () => console.log(`Listening on ${PORT} as ${COLOR}`));
