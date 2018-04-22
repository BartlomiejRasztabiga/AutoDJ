import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import "./App.css";

class App extends Component {
  URL = "http://192.168.1.24:9000";
  socket = socketIOClient(this.URL);

  constructor(props) {
    super(props);
    this.state = {
      currentlyPlaying: ""
    };

    this.socket.on("initialResponse", initialResponse => {
      console.log(initialResponse);

      this.setState({
        currentlyPlaying: initialResponse.currentlyPlaying
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
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <h2>Currently playing</h2>
        </div>
        <div className="row justify-content-center">
          <h4>{this.state.currentlyPlaying}</h4>
        </div>
      </div>
    );
  }
}

export default App;
