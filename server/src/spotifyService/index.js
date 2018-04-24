import SpotifyWebApi from "spotify-web-api-node";
import opn from "opn";

const spotifyService = {
  votes: [],
  skipVotes: [],

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
      redirectUri = "https://autodj.tk:9443/callback",
      clientId = "bec599db35c646c498f4d4b865415a1d",
      clientSecret = "81b778cae9e24ad883e7e25615782f40";

    this.spotifyApi = new SpotifyWebApi({
      redirectUri: redirectUri,
      clientId: clientId,
      clientSecret: clientSecret
    });

    const authorizeURL = this.spotifyApi.createAuthorizeURL(scopes);
    console.log(authorizeURL);
    //opn(authorizeURL, { app: ["chrome.exe"] });
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

    setInterval(() => {
      this.spotifyApi.refreshAccessToken().then(
        data => {
          console.log("token refresh");

          this.spotifyApi.setAccessToken(data.body["access_token"]);
        },
        function(err) {
          console.log("Something went wrong!", err);
        }
      );
    }, 50 * 60 * 1000); //50min
  },

  start: function(io) {
    console.log("start");

    io.on("connection", socket => {
      this.spotifyApi.getMyCurrentPlayingTrack().then(data => {
        if (data.body.is_playing === undefined) return;
        const initialResponse = {
          currentlyPlaying:
            data.body.item.artists[0].name + " - " + data.body.item.name,
          votes: this.votes
        };

        socket.emit("initialResponse", initialResponse);
      });

      setInterval(() => {
        this.spotifyApi.getMyCurrentPlayingTrack().then(data => {
          if (data.body.is_playing === undefined) return;
          socket.emit("currentlyPlaying", data.body);
          socket.emit("votes", this.votes);

          if (!data.body.is_playing) {
            //play next song
            if (this.votes.length > 0) {
              //sort votes
              const sortedVotes = JSON.parse(JSON.stringify(this.votes));
              sortedVotes.sort((a, b) => {
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
        this.spotifyApi.searchTracks(trackName, { limit: 10 }).then(tracks => {
          socket.emit("searchTracksResults", tracks.body.tracks);
        });
      });

      socket.on("vote", data => {
        this.updateVote(data, socket);
        socket.emit("votes", this.votes);
      });

      socket.on("disconnect", () => {});
    });
  },

  updateVote(data, socket) {
    if (!data.track) {
      //super fix
      return;
    }

    let voteDuplication = false;
    this.votes.forEach(vote => {
      // check for vote duplication
      if (
        vote.votesUUIDs.some(
          e => e === data.clientUUID && vote.uri === data.track.uri
        )
      ) {
        //duplication
        socket.emit("voteDuplication");
        voteDuplication = true;
      }
    });

    if (voteDuplication) return;
    if (this.votes.some(e => e.uri === data.track.uri)) {
      const index = this.votes.findIndex(e => e.uri === data.track.uri);
      this.votes[index].votes++;
      this.votes[index].votesUUIDs.push(data.clientUUID);
    } else {
      this.votes.push({
        name: data.track.artists[0].name + " - " + data.track.name,
        uri: data.track.uri,
        votes: 1,
        votesUUIDs: [data.clientUUID]
      });
    }
  }
};

export default spotifyService;
