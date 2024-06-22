import { resolve, join } from "path";
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";

import chalk from "chalk";
import plist from "plist";
import { valid } from "semver";

import { log, readPackage } from "./utils";

type PlistVersion = {
  CFBundleShortVersionString: string;
  CFBundleVersion: string;
};

function findFiles(matchingPattern: string): string[] {
  let matchingFiles: string[] = [];

  try {
      const searchPath = resolve(process.cwd(), "ios/App/App")
      const files = readdirSync(searchPath);
      for (const file of files) {
          let filePath = join(searchPath, file);
          if (statSync(filePath).isFile() && file.includes(matchingPattern)) {
              matchingFiles.push(filePath);
          }
      }
  } catch (error) {
      console.error(`Error while enumerating files in  "ios/App/App": ${error}`);
  }

  return matchingFiles;
}

const infoPlistPaths = findFiles('Info.plist');

export const syncIos = async () => {
  const { version } = readPackage(resolve(process.cwd(), "package.json"));

  if (!valid(version)) {
    log(chalk`  {red Invalid version: "${version}". Nothing to do.}`);
    process.exit();
  }

  infoPlistPaths.forEach(infoPlistPath => {
    try {
        let content = readFileSync(infoPlistPath, { encoding: 'utf8' });

        const infoPlist = plist.parse(content) as PlistVersion;  // Adjust the type as necessary

        infoPlist.CFBundleShortVersionString = version;

        content = plist.build(infoPlist);

        writeFileSync(infoPlistPath, `${content}\n`, { encoding: 'utf8' });
        log(chalk`{green ✔} Sync version ${version} for ios in ${infoPlistPath}.`);
    } catch (error) {
        console.error(`Error processing ${infoPlistPath}: ${error}`);
    }
});
};
