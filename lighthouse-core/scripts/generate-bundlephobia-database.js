/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

/* eslint-disable no-console */

// TODO(saavan) These type definitions are incorrect and need to be fixed.
/** @typedef {import('bundle-phobia-cli').BundlePhobiaLibrary} BundlePhobiaLibrary */

const fs = require('fs');
const path = require('path');
const getPackageVersionList = require('bundle-phobia-cli').fetchPackageStats.getPackageVersionList;
const fetchPackageStats = require('bundle-phobia-cli').fetchPackageStats.fetchPackageStats;

const databasePath = path.join(__dirname, '../lib/large-javascript-libraries/bundlephobia-database.json');


/** @type {Record<string, string[]>} */
const suggestionsJSON = require('../lib/large-javascript-libraries/library-suggestions.js').suggestions;
/** @type string[] */
/* eslint-disable-next-line max-len */
const librarySuggestions = [].concat(...Object.values(suggestionsJSON)).concat(Object.keys(suggestionsJSON));

/** @type {Record<string, Record<'lastScraped', number|string> | Record<'repository', string> | Record<string, BundlePhobiaLibrary>>} */
let database = {};
if (fs.existsSync(databasePath)) {
  database = require(databasePath);
}

/**
 * Returns true if this library has been scraped from BundlePhobia in the past hour.
 * This is used to rate-limit the number of network requests we make to BundlePhobia.
 * @param {string} library
 * @return {boolean}
 */
function hasBeenRecentlyScraped(library) {
  if (!database[library] || database[library].lastScraped === 'Error') return false;
  return (Date.now() - database[library].lastScraped) / (1000 * 60 * 60) < 1;
}

/**
 * Returns true if the object represents valid BundlePhobia JSON.
 * The version string must not match this false-positive expression: '{number} packages'.
 * @param {any} library
 * @return {library is BundlePhobiaLibrary}
 */
function validateLibraryObject(library) {
  return library.hasOwnProperty('name') &&
    library.hasOwnProperty('size') &&
    library.hasOwnProperty('gzip') &&
    library.hasOwnProperty('description') &&
    library.hasOwnProperty('repository') &&
    library.hasOwnProperty('version') &&
    !library.version.match(/^([0-9]+) packages$/);
}

/**
 * Save BundlePhobia stats for a given npm library to the database.
 * @param {string} library
 * @param {number} index
 */
async function collectLibraryStats(library, index) {
  return new Promise(async (resolve, reject) => {
    console.log(`\n◉ (${index}/${librarySuggestions.length}) ${library} `);

    if (hasBeenRecentlyScraped(library)) {
      console.log(`   ❕ Skipping`);
      resolve();
      return;
    }

    /** @type {Array<BundlePhobiaLibrary>} */
    const libraries = [];
    /** @type {string|number} */
    let lastScraped = Date.now();

    const versions = await getPackageVersionList(library, 10);
    for (const version of versions) {
      try {
        const libraryJSON = await fetchPackageStats(version);
        if (validateLibraryObject(libraryJSON)) libraries.push(libraryJSON);
      } catch (e) {
        console.log(`   ❌ Failed to fetch stats | ${version}`);
        lastScraped = 'Error';
      }
    }

    for (let index = 0; index < libraries.length; index++) {
      const library = libraries[index];

      database[library.name] = {
        ...database[library.name],
        [library.version]: {
          gzip: library.gzip,
        },
      };

      if (index === 0) {
        database[library.name] = {
          repository: library.repository,
          lastScraped,
          ...database[library.name],
        };

        database[library.name]['latest'] = database[library.name][library.version];
      }

      if (lastScraped === 'Error') {
        database[library.name] = {
          ...database[library.name],
          lastScraped,
        };
      }

      console.log(`   ✔ ${library.version}` + (index === 0 ? ' (latest)' : ''));
    }

    resolve();
  });
}

(async () => {
  const startTime = new Date();
  console.log(`Collecting ${librarySuggestions.length} libraries...`);

  for (let i = 0; i < librarySuggestions.length; i++) {
    try {
      await collectLibraryStats(librarySuggestions[i], i + 1);
    } catch (e) {
      console.log('Exiting early...\n');
      break;
    }
  }

  console.log(`\n◉ Saving database to ${databasePath}...`);
  fs.writeFile(databasePath, JSON.stringify(database, null, 2), (err) => {
    if (err) {
      console.log(`   ❌ Failed saving | ${err}`);
    } else {
      console.log(`   ✔ Done!`);
    }
    console.log(`\nElapsed Time: ${(new Date() - startTime) / 1000}`);
  });
})();
