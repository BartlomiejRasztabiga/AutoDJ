import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import FlipMove from "react-flip-move";
import "./App.css";

class App extends Component {
  URL = "https://autodj.tk:9443";
  socket = socketIOClient(this.URL);
  clientUUID = localStorage.getItem("clientUUID");

  constructor(props) {
    super(props);

    if (!this.clientUUID) {
      localStorage.setItem("clientUUID", this.guid());
      this.clientUUID = localStorage.getItem("clientUUID");
    }

    this.state = {
      currentlyPlaying: "",
      votes: [],
      searchTrackName: "",
      searchTracks: [],
      voteDuplication: false
    };

    this.socket.on("initialResponse", initialResponse => {
      this.setState({
        currentlyPlaying: initialResponse.currentlyPlaying,
        votes: initialResponse.votes
      });
    });

    this.socket.on("currentlyPlaying", currentlyPlaying => {
      this.setState({
        currentlyPlaying:
          currentlyPlaying.item.artists[0].name +
          " - " +
          currentlyPlaying.item.name
      });
    });

    this.socket.on("votes", votes => {
      this.setState({
        votes: votes
      });
    });

    this.socket.on("searchTracksResults", tracks => {
      this.setState({
        searchTracks: tracks.items,
        voteDuplication: false
      });
    });

    this.socket.on("voteDuplication", () => {
      this.setState({
        voteDuplication: true
      });
    });

    this.handleSearchSubmit = this.handleSearchSubmit.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  handleSearchSubmit(event) {
    event.preventDefault();

    this.socket.emit("searchTracksRequest", this.state.searchTrackName);
  }

  handleSearchChange(event) {
    this.setState({
      searchTrackName: event.target.value
    });
  }

  handleVoteFromSearch(key, event) {
    this.socket.emit("vote", {
      track: this.state.searchTracks[key],
      clientUUID: this.clientUUID
    });
    this.setState({
      searchTracks: [],
      voteDuplication: false
    });
  }

  handleVote(key, event) {
    this.socket.emit("vote", {
      track: this.state.votes[key],
      clientUUID: this.clientUUID
    });
    this.setState({
      searchTracks: [],
      voteDuplication: false
    });
  }

  guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  render() {
    // sort votes
    this.state.votes.sort(function(a, b) {
      if (a.votes < b.votes) return 1;
      if (a.votes > b.votes) return -1;
      return 0;
    });

    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <h2>Currently playing</h2>
        </div>
        <div className="row justify-content-center">
          <h4>{this.state.currentlyPlaying}</h4>
        </div>
        <div
          className="row justify-content-center"
          style={{ marginTop: "30px" }}
        >
          <h2>Search for a song</h2>
        </div>
        <div className="row justify-content-center">
          <form onSubmit={this.handleSearchSubmit}>
            <div className="form-group d-flex">
              <input
                type="text"
                name="trackName"
                className="form-control"
                onChange={this.handleSearchChange}
              />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </div>
          </form>
        </div>
        <div className="row justify-content-center">
          <FlipMove duration={750} easing="ease-out">
            {this.state.searchTracks.map((track, key) => (
              <div className="d-flex" style={{ margin: "5px" }}>
                <div key={key} style={{ marginRight: "5px" }}>
                  {track.artists[0].name + " - " + track.name}
                </div>
                <button
                  onClick={this.handleVoteFromSearch.bind(this, key)}
                  type="button"
                  className="btn btn-primary"
                  style={{ marginLeft: "auto" }}
                >
                  Vote
                </button>
              </div>
            ))}
          </FlipMove>
        </div>
        <div
          className="row justify-content-center"
          style={{
            marginTop: "10px",
            display: this.state.voteDuplication ? "flex" : "none"
          }}
        >
          <div className="alert alert-danger">
            <strong>Vote duplication!</strong> You have already voted on that
            song!
          </div>
        </div>
        <div
          className="row justify-content-center"
          style={{ marginTop: "30px" }}
        >
          <h2>Votes</h2>
        </div>
        <div className="row justify-content-center">
          <FlipMove duration={750} easing="ease-out">
            {this.state.votes.map((vote, key) => (
              <div key={key} className="d-flex" style={{ margin: "5px" }}>
                <span
                  className="badge badge-pill badge-primary"
                  style={{ height: "20px", marginRight: "5px" }}
                >
                  {vote.votes} votes
                </span>
                <div style={{ marginRight: "5px" }}>{vote.name}</div>
                <button
                  onClick={this.handleVote.bind(this, key)}
                  type="button"
                  className="btn btn-primary"
                  style={{ marginLeft: "auto" }}
                >
                  Vote
                </button>
              </div>
            ))}
          </FlipMove>
        </div>
      </div>
    );
  }
}

export default App;
