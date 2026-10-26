import { Composition } from "remotion";
import { BrainLying, DURATION } from "./BrainLying/BrainLying";
import { DURATION as LAST_LIGHT_01, Part01 } from "./LastLight/Part01/Part01";
import { DURATION as LAST_LIGHT_02, Part02 } from "./LastLight/Part02/Part02";
import { DURATION as LAST_LIGHT_03, Part03 } from "./LastLight/Part03/Part03";
import { DURATION as LAST_LIGHT_04, Part04 } from "./LastLight/Part04/Part04";

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
      <Composition
        id="LastLight-Part02"
        component={Part02}
        durationInFrames={LAST_LIGHT_02}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part03"
        component={Part03}
        durationInFrames={LAST_LIGHT_03}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part04"
        component={Part04}
        durationInFrames={LAST_LIGHT_04}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
