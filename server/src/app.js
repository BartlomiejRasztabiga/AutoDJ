import express from "express";
import http from "http";
import spotifyService from "./spotifyService";

const app = express();
const server = http.createServer(app);

const io = require("socket.io").listen(server);

app.get("/callback", (req, res) => {
  spotifyService.postInit(req.query.code, io);
  res.send("AutoDJ started!");
});

server.listen(9000, () => console.log("Server listening on port 9000!"));
spotifyService.init();

export default app;
