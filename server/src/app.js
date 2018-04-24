import express from "express";
import http from "http";
import https from "https";
import helmet from "helmet";
import spotifyService from "./spotifyService";

const options = {
  cert: fs.readFileSync("./sslcert/fullchain.pem"),
  key: fs.readFileSync("./sslcert/privkey.pem")
};

const app = express();
const server = http.createServer(app);
const httpsServer = https.createServer(options, app);

const io = require("socket.io").listen(httpsServer);

app.use(helmet());

app.get("/callback", (req, res) => {
  spotifyService.postInit(req.query.code, io);
  res.send("AutoDJ started!");
});

server.listen(9000, () => console.log("Server listening on port 9000!"));
httpsServer.listen(9443, () =>
  console.log("HTTPS Server listening on port 9443!")
);
spotifyService.init();

export default app;
