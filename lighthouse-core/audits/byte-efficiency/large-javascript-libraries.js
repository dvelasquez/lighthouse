/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview This audit checks a page for any unnecessarily large npm dependencies.
 * These libraries can be replaced with functionally equivalent, smaller ones.
 */

'use strict';

/** @typedef {{name: string, version: string, gzip: number, description: string, repository: string}} BundlePhobiaLibrary */

const libStats = require('./bundlephobia-database.json');
const librarySuggestions = require('./library-suggestions.json');

const Audit = require('../audit.js');
const i18n = require('../../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on large Javascript libraries that are used on the page that have better alternatives. This descriptive title is shown when to users when no known unnecessarily large libraries are detected on the page.*/
  title: 'Avoids unnecessarily large JavaScript libraries',
  /** Title of a Lighthouse audit that provides detail on large Javascript libraries that are used on the page that have better alternatives. This descriptive title is shown when to users when some known unnecessarily large libraries are detected on the page.*/
  failureTitle: 'Replace unnecessarily large JavaScript libraries',
  /** Description of a Lighthouse audit that tells the user why they should care about the large Javascript libraries that have better alternatives.. This is displayed after a user expands the section to see more. No character length limits. */
  description: 'Large JavaScript libraries can lead to poor performance. ' +
    'Prefer smaller, functionally equivalent libraries to reduce your bundle size.' +
    ' [Learn more](https://developers.google.com/web/fundamentals/performance/webpack/decrease-frontend-size#optimize_dependencies).',
  /** Label for a column in a data table. Entries will be names of large JS libraries that could be replaced. */
  name: 'Library Name',
  /** Label for a column in a data table. Entries will be names of smaller libraries that could be used as a replacement. */
  suggestion: 'Smaller Alternative',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class LargeJavascriptLibraries extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'large-javascript-libraries',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['Stacks'],
    };
  }

  /**
   * @param {LH.Artifacts.DetectedStack} library
   * @return {string[]}
   */
  static getSuggestions(library) {
    for (const key of Object.keys(librarySuggestions)) {
      if (librarySuggestions[key].includes(library.npm)) {
        return librarySuggestions[key].filter(suggestion => suggestion !== library.npm);
      }
    }
    return [];
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    /** @type {Array<{original: BundlePhobiaLibrary, suggestion: BundlePhobiaLibrary}>} */
    const libraryPairings = [];
    const foundLibraries = artifacts.Stacks.filter(stack => stack.detector === 'js');

    const seenLibraries = new Set();

    for (const library of foundLibraries) {
      const suggestions = this.getSuggestions(library);
      if (!library.npm || !libStats[library.npm] || !suggestions.length) continue;

      if (seenLibraries.has(library.npm)) continue;
      seenLibraries.add(library.npm);

      const version = !!library.version && !!libStats[library.npm][library.version]
        ? library.version
        : 'latest';

      suggestions.map(suggestion => {
        const isSmallerSuggestion = !!libStats[suggestion] &&
          libStats[suggestion]['latest'].gzip < libStats[library.npm][version].gzip;

        if (isSmallerSuggestion) {
          libraryPairings.push({
            original: libStats[library.npm][version],
            suggestion: libStats[suggestion]['latest'],
          });
        }
      });
    }

    const tableDetails = [];
    let currentAlternative = 0;

    for (let i = 0; i < libraryPairings.length; i++) {
      if (i > 0) {
        if (libraryPairings[i].original.name === libraryPairings[i - 1].original.name) {
          currentAlternative++;
        } else {
          currentAlternative = 1;
        }
      } else {
        currentAlternative++;
      }

      const original = libraryPairings[i].original;
      const suggestion = libraryPairings[i].suggestion;

      tableDetails.push({
        name: {
          text: currentAlternative === 1 ? original.name : '',
          url: currentAlternative === 1 ? original.repository : '',
          type: 'link',
        },
        suggestion: {
          text: currentAlternative + '. ' + suggestion.name,
          url: suggestion.repository,
          type: 'link',
        },
        savings: original.gzip - suggestion.gzip,
        originalURL: original.repository,
        suggestionURL: suggestion.repository,
        subItems: {
          type: 'subitems',
          items: [{suggestionDescription: suggestion.description}],
        },
      });
    }

    /** @type {LH.Audit.Details.TableColumnHeading[]} */
    const headings = [
      /* eslint-disable max-len */
      {key: 'name', itemType: 'url', text: str_(UIStrings.name)},
      {key: 'suggestion', itemType: 'url', text: str_(UIStrings.suggestion), subItemsHeading: {key: 'suggestionDescription'}},
      {key: 'savings', itemType: 'bytes', text: str_(i18n.UIStrings.columnWastedBytes)},
      /* eslint-enable max-len */
    ];

    const details = Audit.makeTableDetails(headings, tableDetails, {});

    return {
      score: libraryPairings.length > 0 ? 0 : 1,
      details: {
        ...details,
      },
    };
  }
}

module.exports = LargeJavascriptLibraries;
module.exports.UIStrings = UIStrings;
