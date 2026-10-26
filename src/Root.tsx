import { Composition } from "remotion";
import { BrainLying, DURATION } from "./BrainLying/BrainLying";
import { DURATION as LAST_LIGHT_01, Part01 } from "./LastLight/Part01/Part01";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrainLying"
        component={BrainLying}
        durationInFrames={DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part01"
        component={Part01}
        durationInFrames={LAST_LIGHT_01}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
