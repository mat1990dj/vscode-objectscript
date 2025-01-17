import fs = require("fs");
import path = require("path");
import * as vscode from "vscode";
import { schemas, workspaceState } from "../extension";

export const outputChannel = vscode.window.createOutputChannel("ObjectScript");

export function outputConsole(data: string[]): void {
  data.forEach((line): void => {
    outputChannel.appendLine(line);
  });
}

// tslint:disable-next-line: interface-name
export interface CurrentFile {
  name: string;
  fileName: string;
  content: string;
  uri: vscode.Uri;
}

export function currentFile(document?: vscode.TextDocument): CurrentFile {
  document = document || (vscode.window.activeTextEditor.document ? vscode.window.activeTextEditor.document : null);
  if (!document || !document.fileName || !document.languageId || !document.languageId.startsWith("objectscript")) {
    return null;
  }
  const uri = document.uri;
  const fileName = document.fileName;
  const content = document.getText();
  const fileExt = fileName.match(/\.(\w+)$/)[1].toLowerCase();
  let name = "";
  let ext = "";
  if (fileExt === "cls") {
    const match = content.match(/^Class (%?\w+(?:\.\w+)+)/im);
    if (match) {
      name = match[1];
      ext = "cls";
    }
  } else {
    const match = content.match(/^ROUTINE ([^\s]+)(?:\s+\[.*Type=([a-z]{3,}))?/i);
    name = match[1];
    ext = match[2] || "mac";
  }
  if (!name) {
    return null;
  }
  name += "." + ext;

  return {
    content,
    fileName,
    name,
    uri,
  };
}

export async function mkdirSyncRecursive(dirpath: string): Promise<string> {
  if (fs.existsSync(dirpath)) {
    return Promise.resolve(dirpath);
  }
  const mkdir = (currentPath, folder): void => {
    currentPath += folder + path.sep;

    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }

    return currentPath;
  };
  return new Promise<string>((resolve, reject): void => {
    try {
      dirpath.split(path.sep).reduce(mkdir, "");
      resolve(dirpath);
    } catch (error) {
      reject(error);
    }
  });
}

export function currentWorkspaceFolder(document?: vscode.TextDocument): string {
  let workspaceFolder;
  document = document ? document : vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;
  if (document) {
    const uri = document.uri;
    if (uri.scheme === "file") {
      if (vscode.workspace.getWorkspaceFolder(uri)) {
        workspaceFolder = vscode.workspace.getWorkspaceFolder(uri).name;
      }
    } else if (schemas.includes(uri.scheme)) {
      workspaceFolder = uri.authority;
    }
  }
  const first =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length
      ? vscode.workspace.workspaceFolders[0].name
      : "";
  return workspaceFolder || workspaceState.get<string>("workspaceFolder") || first;
}

export function workspaceFolderUri(workspaceFolder: string = currentWorkspaceFolder()): vscode.Uri {
  return vscode.workspace.workspaceFolders.find(
    (el): boolean => el.name.toLowerCase() === workspaceFolder.toLowerCase()
  ).uri;
}

export function onlyUnique(value: any, index: number, self: any): boolean {
  if (value && value.name) {
    return self.findIndex((el): boolean => el.name === value.name) === index;
  }
  return self.indexOf(value) === index;
}

export function notNull(el: any): boolean {
  return el !== null;
}
