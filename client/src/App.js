import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import "./App.css";
import {
  AppBar,
  Input,
  List,
  ListItem,
  ListSubheader,
  Snackbar,
  Toolbar,
  Typography
} from "material-ui";
import { withStyles } from "material-ui/styles";
import Song from "./Song";

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
    this.handleCloseSnackbar = this.handleCloseSnackbar.bind(this);
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

  handleCloseSnackbar() {
    this.setState({ voteDuplication: false });
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

    const duplicateMessage = (
      <span id="message-id">You've already voted on this one</span>
    );
    const { votes, searchTracks, currentlyPlaying } = this.state;
    const { classes } = this.props;
    return (
      <div>
        <AppBar
          className={`${
            this.state.currentlyPlaying ? "appBarOn" : "appBarOff"
          } mb-2`}
          position="static"
        >
          <Toolbar>
            <Typography variant="title" color="inherit">
              {currentlyPlaying ? currentlyPlaying : "AutoDJ"}
            </Typography>
          </Toolbar>
        </AppBar>

        <List className={classes.root} subheader={<li />}>
          <li key={"search1"} className={classes.listSection}>
            <ul className={classes.ul}>
              <ListSubheader>
                <form onSubmit={this.handleSearchSubmit}>
                  <Input
                    placeholder="Search"
                    className={classes.input}
                    fullWidth={true}
                    onChange={this.handleSearchChange}
                    inputProps={{
                      "aria-label": "Description"
                    }}
                  />
                </form>
              </ListSubheader>
              {searchTracks.map((song, key) => (
                <ListItem key={key}>
                  <Song
                    artist={song.artists[0].name}
                    name={song.name}
                    votes={song.votes}
                    onVote={this.handleVoteFromSearch.bind(this, key)}
                  />
                </ListItem>
              ))}
            </ul>
          </li>
          <li key={"queue"} className={classes.listSection}>
            <ul className={classes.ul}>
              <ListSubheader>Songs in queue</ListSubheader>
              {votes.map((song, key) => (
                <ListItem>
                  <Song
                    name={song.name}
                    votes={song.votes}
                    onVote={this.handleVote.bind(this, key)}
                  />
                </ListItem>
              ))}
            </ul>
          </li>
        </List>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          open={this.state.voteDuplication}
          onClose={this.handleCloseSnackbar}
          SnackbarContentProps={{
            "aria-describedby": "message-id"
          }}
          message={duplicateMessage}
        />
      </div>
    );
  }
}

const styles = theme => ({
  root: {
    width: "100%",
    backgroundColor: theme.palette.background.paper,
    position: "relative",
    overflow: "auto",

    maxHeight: "80vh"
  },
  appBar: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)"
  },
  listSection: {
    backgroundColor: "inherit"
  },
  ul: {
    backgroundColor: "inherit",
    padding: 0
  },
  input: {
    // margin: theme.spacing.unit,
  },
  icon: {
    margin: theme.spacing.unit
  },
  margin: {
    margin: theme.spacing.unit
  },
  button: {
    margin: theme.spacing.unit
  }
});
export default withStyles(styles)(App);
