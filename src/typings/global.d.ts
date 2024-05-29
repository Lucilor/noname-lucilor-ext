import {LoDashStatic} from "lodash";

declare global {
  const _: LoDashStatic;

  const lib: Library;
  const game: Game;
  const ui: UI;
  const get: Get;
  const ai: AI;
  const _status: Status;
  type GameImportFunction<T = void> = (lib: Library, game: Game, ui: UI, get: Get, ai: AI, status: Status) => T;

  type ExSkillConifgData = Required<PackageData["skill"]>;

  function resolveLocalFileSystemURL(path: string, success: (fileEntry: FileEntry) => void, error: () => void): void;
}
