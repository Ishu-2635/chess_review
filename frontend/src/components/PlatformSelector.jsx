// import { Globe, Upload, Trophy } from "lucide-react";
// import PlatformCard from "./PlatformCard";

// const PlatformSelector = ({ platform, setPlatform }) => {
//   return (
//     <div className="grid grid-cols-3 gap-4">
//       <PlatformCard
//         title="Chess.com"
//         value="chesscom"
//         selected={platform}
//         onSelect={setPlatform}
//         icon={<Trophy size={34} className="text-amber-400" />}
//       />

//       <PlatformCard
//         title="Lichess"
//         value="lichess"
//         selected={platform}
//         onSelect={setPlatform}
//         icon={<Globe size={34} className="text-white" />}
//       />

//       <PlatformCard
//         title="PGN Upload"
//         value="pgn"
//         selected={platform}
//         onSelect={setPlatform}
//         icon={<Upload size={34} className="text-white" />}
//       />
//     </div>
//   );
// };

// export default PlatformSelector;

import { Globe, Upload, Trophy } from "lucide-react";
import PlatformCard from "./PlatformCard";

const PlatformSelector = ({ platform, setPlatform }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <PlatformCard
        title="Chess.com"
        value="chesscom"
        selected={platform}
        onSelect={setPlatform}
        icon={<Trophy size={34} className="text-amber-400" />}
      />

      <PlatformCard
        title="Lichess"
        value="lichess"
        selected={platform}
        onSelect={setPlatform}
        icon={<Globe size={34} className="text-white" />}
      />

      <PlatformCard
        title="PGN Upload"
        value="pgn"
        selected={platform}
        onSelect={setPlatform}
        icon={<Upload size={34} className="text-white" />}
      />
    </div>
  );
};

export default PlatformSelector;