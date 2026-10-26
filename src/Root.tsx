import { Composition } from "remotion";
import { BrainLying, DURATION } from "./BrainLying/BrainLying";

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
    </>
  );
};
