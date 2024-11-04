import { run, styled } from "uebersicht";

const refreshFrequency = 500;
const size = 120;
const Sep = "⎖"; // Ideally, this is never a character in a song title!

const command = async (dispatch) => {
  refresh(dispatch);
};

const getTrackProperties = () =>
  run(
    `osascript <<'END'
    set output to ""
    if application "Spotify" is running then
      tell application "Spotify"
        set output to player state & "${Sep}" & current track's name & "${Sep}" & current track's artist & "${Sep}" & current track's album & "${Sep}" & current track's artwork url & "${Sep}" & current track's duration & "${Sep}" & player position
      end tell
    end if
  `
  );

const waitAndRefresh = async (dispatch) => {
  setTimeout(() => refresh(dispatch), 50);
};

const refresh = async (dispatch) => {
  const props = await getTrackProperties();
  if (props == "") {
    dispatch({
      dispatch,
      type: "SONG_DATA",
      data: { appAvailable: false },
    });
    return;
  }
  const [playing, song, artist, album, cover, duration, position] = props
    .slice(0, -1)
    .split(`, ${Sep}, `); // This is weird Applescript behavior new to macOS 10.15.4
  dispatch({
    dispatch,
    type: "SONG_DATA",
    data: {
      dispatch,
      playing: playing == "playing",
      position: Number(position / (duration / 1000)),
      song,
      artist,
      album,
      cover,
      appAvailable: true,
    },
  });
};


const commandSpotify = async (verb, dispatch) => {
  await run(
    `osascript <<'END'
    if application "Spotify" is running then
      tell application "Spotify"
        ${verb}
      end tell
    end if
  `
  );
  waitAndRefresh(dispatch);
};

const Container = styled("div")`
  display: flex;
  flex-direction: row;
  align-items: center;
  transition: opacity 0.4s linear;
  &:hover{
    opacity: 1;
  }
`;

const Song = styled("h1")`
  font-size: 40px;
  margin: 0 0;
  white-space: nowrap;
`;

const Artist = styled("h2")`
  font-size: 20px;
  font-weight: normal;
  margin: 0 0;
  white-space: nowrap;
`;

const Cover = styled("img")`
  border-radius: 10px;
  height: ${size}px;
  width: ${size}px;
  margin-right: ${size * 0.15}px;
`;

const CentralCover = styled("img")`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 10px;
  height: 400px; 
  width: 400px;  
  transition: opacity 0.5s linear;
`;

const Button = styled("div")`
  display: inline-block;
  padding: 5px 8.3px;

  &:hover svg {
    color: #ccc;
  }

  &:active svg {
    transform: scale(0.95) translateY(1px);
  }
`;

const Separator = styled("div")`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0;
  height: 4px;
  flex: 1;
  margin: 6px 0;
  position: relative;
  max-width: 12em;
  
  box-shadow: 0px 1px 4px #000000;

  &::after {
    content: "";
    display: block;
    transition: width 1s ease-in-out;
    border-top: solid 4px rgba(255, 255, 255, 0.5);
    width: ${(props) => (props.position ? props.position * 96 + 4 : 100)}%;
  }
`;

const FFButton = ({ backwards, dispatch }) => {
  return (
    <Button
      onClick={(_) =>
        commandSpotify(backwards ? "previous track" : "next track", dispatch)
      }
    >
      <svg
        width="40"
        height="30"
        viewBox="0 0 12 8"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: backwards ? "" : "scaleX(-1)" }}
      >
        <path d="M6.10849 1.43426C6.10849 1.07081 5.58133 0.868751 5.22546 1.0958L1.20398 3.66153C0.932007 3.83505 0.932007 4.16495 1.20398 4.33847L5.22546 6.9042C5.58133 7.13125 6.10849 6.92919 6.10849 6.56574V1.43426Z" />
        <path d="M11 1.43426C11 1.07081 10.4728 0.868751 10.117 1.0958L6.09549 3.66153C5.82352 3.83505 5.82352 4.16495 6.09549 4.33847L10.117 6.9042C10.4728 7.13125 11 6.92919 11 6.56574V1.43426Z" />
      </svg>
    </Button>
  );
};

const PlayPauseButton = ({ playing, dispatch }) => {
  return (
    <Button
      onClick={() => commandSpotify(playing ? "pause" : "play", dispatch)}
    >
      <svg
        width="25"
        height="30"
        viewBox="0 0 8 8"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        {playing ? (
          <g>
            <rect width="3" height="8" rx="0.6" />
            <rect x="5" width="3" height="8" rx="0.6" />
          </g>
        ) : (
          <path d="M1 0.689272V7.31073C1 7.61786 1.33179 7.8104 1.59846 7.65803L7.39223 4.3473C7.66096 4.19374 7.66096 3.80626 7.39223 3.6527L1.59846 0.341974C1.33179 0.189596 1 0.382143 1 0.689272Z" />
        )}
      </svg>
    </Button>
  );
};

const initialState = { loading: true, size: 35 };

const updateState = (event, previousState) => {
  if (event.type == "SONG_DATA") {
    return {
      ...previousState,
      ...event.data,
      dispatch: event.dispatch,
      loading: false,
    };
  } else return previousState;
};


const render = (data) => {
  if (data.error || data.loading) return <div></div>;
  const { song, artist, album, cover, playing, position, appAvailable, hovered } = data;



  return (
    <div>
      <CentralCover src={cover} style={{ opacity: appAvailable ? 1 : 0 }} />
      <Container
        style={{ opacity: !appAvailable ? 0 : playing ? 1 : hovered ? 1 : 0.3 }}
        onMouseEnter={() => data.hovered = true}
        onMouseLeave={() => data.hovered = false}
      >
        <Cover src={cover} size={size} />
        <div>
          <Song>{song}</Song>
          <Separator position={position} />
          <Artist>
            {artist}
            {artist && album ? " – " : ""}
            <em>{album}</em>
          </Artist>
          <div style={{ marginLeft: -4 }}>
            <FFButton backwards dispatch={data.dispatch} />
            <PlayPauseButton playing={playing} dispatch={data.dispatch} />
            <FFButton dispatch={data.dispatch} />
          </div>
        </div>
      </Container>
    </div>
  );
};

const className = `
        cursor: default;
        user-select: none;
        font-family: -apple-system, sans-serif;
        text-shadow: 0px 1px 4px #000000;
        bottom: 10px;
        left: 10px;
        color: #fff;
        max-width: 20em;
        fill: #fff;
        `;

export {
  refreshFrequency,
  command,
  initialState,
  updateState,
  className,
  render,
};

/*
  Applescript reference for Spotify's "track" entry:

  artist
  album
  disc number
  duration
  played count
  track number
  popularity
  id
  name
  artist
  artwork url
  spotify url
*/
