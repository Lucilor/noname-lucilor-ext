import {SkillList} from "./skill-helper";

export interface GameDataExportOptions {
  configFilter?: (key: string, value: any) => boolean;
}

export interface GameData {
  config: any;
  data: any;
}

export interface WaitForSometingOpts {
  interval?: number;
  timeout?: number;
}

export interface LucilorExtConfig {
  skipMiniGames: boolean;
  colorfulSkillInfo: boolean;
  replaceCharacter: string;
  singleCharacter: boolean;
  resizeOnStart: boolean;
  menuStyles: boolean;
}

export interface AomiSkillConfig {
  character: string;
  characterCN: string;
  audios: {
    aomi: string;
    dmgCount: string;
    dieBefore: string;
  };
}

export interface ChooseSkillListParams {
  num: number;
  filter?: (skill: string, info: Skill) => boolean;
}
export interface ChooseSkillsParams {
  limit: number | [number, number];
  chooseFrom: SkillList;
  chooseFromLabel?: string;
  chooseTo: SkillList;
  chooseToLabel?: string;
  forced?: boolean;
}
export interface DiscoverAomiSkillParams {
  filter?: ChooseSkillListParams["filter"];
}
