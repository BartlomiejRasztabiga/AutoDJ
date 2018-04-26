import React from "react";
import { Button } from "material-ui";

const Song = props => {
  const { name, votes, onVote, artist } = props;
  return (
    <div className="row mx-0">
      <p className="my-auto">
        <b>{name}</b>
      </p>
      {artist ? <p className="my-auto ml-2">{artist}</p> : null}

      <Button mini={true} className="my-auto" onClick={onVote}>{`vote ${
        votes ? votes : ""
      }`}</Button>
    </div>
  );
};

export default Song;
