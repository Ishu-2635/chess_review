import { useState } from "react";
import Card from "../components/Card";
import PlatformSelector from "../components/PlatformSelector";

const Home = () => {
  const [platform, setPlatform] = useState("chess.com");

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex justify-center items-center px-5">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-10">

          <h1 className="text-5xl font-bold">
            Chess Review
          </h1>

          <p className="text-neutral-400 mt-3">
            Analyze Chess.com, Lichess or PGN games using Stockfish.
          </p>

        </div>

        <Card>

          <PlatformSelector
            platform={platform}
            setPlatform={setPlatform}
          />

          <div className="mt-8">

            <p className="text-neutral-400">
              Selected Platform
            </p>

            <h2 className="text-2xl font-semibold mt-2 ">
              {platform}
            </h2>

          </div>

        </Card>

      </div>
    </div>
  );
};

export default Home;