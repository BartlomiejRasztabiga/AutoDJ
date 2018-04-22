import SpotifyWebApi from "spotify-web-api-node";
import opn from "opn";

const spotifyService = {
  votes: [],

  init: function() {
    console.log("init");

    const scopes = [
        "user-read-private",
        "user-read-email",
        "playlist-modify-private",
        "streaming",
        "user-read-playback-state",
        "user-read-currently-playing",
        "user-modify-playback-state"
      ],
      redirectUri = "http://localhost:9000/callback",
      clientId = "bec599db35c646c498f4d4b865415a1d",
      clientSecret = "81b778cae9e24ad883e7e25615782f40";

    this.spotifyApi = new SpotifyWebApi({
      redirectUri: redirectUri,
      clientId: clientId,
      clientSecret: clientSecret
    });

    const authorizeURL = this.spotifyApi.createAuthorizeURL(scopes);
    opn(authorizeURL, { app: ["chrome.exe"] });
  },

  postInit: function(code, io) {
    console.log("post init");

    this.spotifyApi.authorizationCodeGrant(code).then(
      data => {
        // Set the access token on the API object to use it in later calls
        this.spotifyApi.setAccessToken(data.body["access_token"]);
        this.spotifyApi.setRefreshToken(data.body["refresh_token"]);

        this.start(io);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  },

  start: function(io) {
    console.log("start");

    io.on("connection", socket => {
      this.spotifyApi.getMyCurrentPlayingTrack().then(data => {
        const initialResponse = {
          currentlyPlaying:
            data.body.item.artists[0].name + " - " + data.body.item.name,
          votes: this.votes
        };

        socket.emit("initialResponse", initialResponse);
      });

      setInterval(() => {
        this.spotifyApi.getMyCurrentPlayingTrack().then(data => {
          socket.emit("currentlyPlaying", data.body);
          socket.emit("votes", this.votes);

          if (!data.body.is_playing) {
            //play next song
            if (this.votes.length > 0) {
              //sort votes
              const sortedVotes = JSON.parse(JSON.stringify(this.votes));
              sortedVotes.sort(function(a, b) {
                if (a.votes < b.votes) return 1;
                if (a.votes > b.votes) return -1;
                return 0;
              });

              const topTrack = sortedVotes[0];
              this.votes = sortedVotes.filter(e => e.uri !== topTrack.uri);
              socket.emit("votes", this.votes);

              this.spotifyApi.play({ uris: [topTrack.uri] });
            }
          }
        });
      }, 5000); // every 5 seconds

      socket.on("searchTracksRequest", trackName => {
        this.spotifyApi.searchTracks(trackName, { limit: 5 }).then(tracks => {
          socket.emit("searchTracksResults", tracks.body.tracks);
        });
      });

      socket.on("vote", track => {
        this.updateVote(track);
        socket.emit("votes", this.votes);
      });

      socket.on("disconnect", () => {});
    });
  },

  updateVote(track) {
    if (this.votes.some(e => e.uri === track.uri)) {
      const index = this.votes.findIndex(e => e.uri === track.uri);
      this.votes[index].votes++;
    } else {
      this.votes.push({
        name: track.artists[0].name + " - " + track.name,
        uri: track.uri,
        votes: 1
      });
    }
  }
};

export default spotifyService;
