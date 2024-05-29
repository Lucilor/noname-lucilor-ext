import {ObjectOf} from "@lucilor/utils";

export class SkillTipsHelper {
  skillTips: ObjectOf<string> = {};

  private _lastSkillTipsInfo: {div: HTMLDivElement; fn: () => void} | null = null;

  private _clearLastSkillTips() {
    if (this._lastSkillTipsInfo) {
      document.body.removeEventListener("click", this._lastSkillTipsInfo.fn);
      this._lastSkillTipsInfo.div.remove();
      this._lastSkillTipsInfo = null;
    }
  }

  constructor(lib: Library) {
    for (const item of lib.help.游戏名词.matchAll(/(<ul>)?<li>([^：]*)：([^<]*)/g)) {
      const key = item[2];
      const value = item[3];
      if (key && value) {
        this.skillTips[key] = value;
      }
    }
  }

  popupSkillTips(event: PointerEvent, key: string) {
    event.stopPropagation();
    this._clearLastSkillTips();
    const el = event.target as HTMLElement;
    const parents: HTMLElement[] = [];
    let curr = el;
    while (curr.parentElement) {
      if (curr.id === "window") {
        break;
      }
      parents.push(curr.parentElement);
      curr = curr.parentElement;
    }
    const parentEl = parents.at(-2);
    const parentEl2 = parents.at(-1);
    if (parentEl && parentEl2 && key in this.skillTips) {
      const observer = new MutationObserver((mutationList) => {
        if (mutationList.some((mutation) => Array.from(mutation.removedNodes).includes(parentEl))) {
          this._clearLastSkillTips();
          observer.disconnect();
        }
      });
      observer.observe(parentEl2, {childList: true});
      const left = event.clientX / game.documentZoom + 5;
      const top = event.clientY / game.documentZoom + 5;
      const div = ui.create.div(".skill-tips", this.skillTips[key], document.body, [0, top, 0, left]);
      const fn = () => {
        this._clearLastSkillTips();
      };
      this._lastSkillTipsInfo = {div, fn};
      document.body.addEventListener("click", fn);
      div.addEventListener("click", (event2) => {
        event2.stopPropagation();
        this._clearLastSkillTips();
      });
    }
  }
}
