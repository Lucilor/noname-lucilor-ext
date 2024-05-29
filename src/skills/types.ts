import {SkillTipsHelper} from "@/lucilor-ext-cls/skill-tips-helper";
import {ObjectOf} from "@lucilor/utils";

export interface SkillSetItem {
  name: string;
  isGlobal?: boolean;
  data: Skill;
  translate?: ObjectOf<string>;
  tips?: SkillTipsHelper["skillTips"];
}

export type SkillSet = SkillSetItem[];

export type SkillSetGetter = GameImportFunction<SkillSet>;
