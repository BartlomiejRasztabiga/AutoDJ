import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import FlipMove from "react-flip-move";
import "./App.css";

class App extends Component {
  URL = "http://autodj.tk:9000";
  socket = socketIOClient(this.URL);

  constructor(props) {
    super(props);
    this.state = {
      currentlyPlaying: "",
      votes: [],
      searchTrackName: "",
      searchTracks: []
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
        searchTracks: tracks.items
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
    this.socket.emit("vote", this.state.searchTracks[key]);
    this.setState({
      searchTracks: []
    });
  }

  handleVote(key, event) {
    this.socket.emit("vote", this.state.votes[key]);
    this.setState({
      searchTracks: []
    });
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
