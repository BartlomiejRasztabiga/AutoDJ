import express from "express";
import http from "http";
import spotifyService from "./spotifyService";

const app = express();
const server = http.createServer(app);

const io = require("socket.io").listen(server);

app.get("/play", (req, res) => spotifyService.playTrack());
app.get("/callback", (req, res) => {
  spotifyService.postInit(req.query.code, io);
  res.send("AutoDJ started!");
});

server.listen(3000, () => console.log("Server listening on port 3000!"));
spotifyService.init();

export default app;
