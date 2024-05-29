import {ObjectOf} from "@lucilor/utils";

export const replaceHtml = (html: string, data: ObjectOf<string>) => {
  for (const key in data) {
    html = html.replace(new RegExp(`{{[ ]*${key}[ ]*}}`, "g"), data[key]);
  }
  return html;
};
