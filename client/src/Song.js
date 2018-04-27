import React from "react";
import { Button, createMuiTheme, MuiThemeProvider } from "material-ui";

const theme = createMuiTheme({
    palette: {
        primary: {
            light: "#e73c7e",
            main: "#e73c7e",
            dark: "#e73c7e",
            contrastText: "#000"
        }
    }
});

const Song = props => {
    const { name, votes, onVote, artist } = props;
    return (
        <div className="row mx-0">
            <p className="my-auto">
                <b>{name}</b>
            </p>
            {artist ? <p className="my-auto ml-2">{artist}</p> : null}
            <MuiThemeProvider theme={theme}>
                <Button
                    mini={true}
                    color="primary"
                    className="my-auto"
                    onClick={onVote}
                >{`vote ${votes ? votes : ""}`}</Button>
            </MuiThemeProvider>
        </div>
    );
};

export default Song;
