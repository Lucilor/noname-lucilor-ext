import {EXTENSION_AUTHOR, EXTENSION_NAME, EXTENSION_VERSION} from "@/const";
import {replaceHtml} from "../utils";
import html from "./intro.html?raw";
import "./intro.scss";

export const introHtml = replaceHtml(html, {name: EXTENSION_NAME, author: EXTENSION_AUTHOR, version: EXTENSION_VERSION});
