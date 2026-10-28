import { Composition } from "remotion";
import { BrainLying, DURATION } from "./BrainLying/BrainLying";
import { DURATION as LAST_LIGHT_01, Part01 } from "./LastLight/Part01/Part01";
import { DURATION as LAST_LIGHT_02, Part02 } from "./LastLight/Part02/Part02";
import { DURATION as LAST_LIGHT_03, Part03 } from "./LastLight/Part03/Part03";
import { DURATION as LAST_LIGHT_04, Part04 } from "./LastLight/Part04/Part04";
import { DURATION as LAST_LIGHT_05, Part05 } from "./LastLight/Part05/Part05";
import { DURATION as LAST_LIGHT_06, Part06 } from "./LastLight/Part06/Part06";
import { DURATION as LAST_LIGHT_07, Part07 } from "./LastLight/Part07/Part07";
import { DURATION as LAST_LIGHT_08, Part08 } from "./LastLight/Part08/Part08";
import { DURATION as LAST_LIGHT_09, Part09 } from "./LastLight/Part09/Part09";
import { DURATION as LAST_LIGHT_10, Part10 } from "./LastLight/Part10/Part10";

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
      <Composition
        id="LastLight-Part05"
        component={Part05}
        durationInFrames={LAST_LIGHT_05}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part06"
        component={Part06}
        durationInFrames={LAST_LIGHT_06}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part07"
        component={Part07}
        durationInFrames={LAST_LIGHT_07}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part08"
        component={Part08}
        durationInFrames={LAST_LIGHT_08}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part09"
        component={Part09}
        durationInFrames={LAST_LIGHT_09}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="LastLight-Part10"
        component={Part10}
        durationInFrames={LAST_LIGHT_10}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
