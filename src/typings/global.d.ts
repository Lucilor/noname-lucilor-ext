import {ObjectOf} from "@lucilor/utils";
import {LoDashStatic} from "lodash";

declare global {
  const _: LoDashStatic;

  const lib: Library;
  const game: Game & ObjectOf<any>;
  const ui: UI & ObjectOf<any>;
  const get: Get;
  const ai: AI;
  const _status: Status & ObjectOf<any>;
  type GameImportFunction<T = void> = (lib: Library, game: Game, ui: UI, get: Get, ai: AI, status: Status) => T;

  type ExSkillConifgData = Required<PackageData["skill"]>;

  function resolveLocalFileSystemURL(path: string, success: (fileEntry: FileEntry) => void, error: () => void): void;
}
