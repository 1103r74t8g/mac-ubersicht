import { run } from "uebersicht";

const render = () => {
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: "-100",
      }}
    >
      <img
        src="wave.widget/soundWave.gif"
        style={{
          position: "absolute",
          top: "520px",
          left: "520px",
          width: "400px",
          height: "400px",
          opacity: "1",
        }}
      />
    </div>
  );
};

export { render };
