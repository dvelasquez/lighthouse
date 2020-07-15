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

const bundlePhobiaStats = require('./bundlephobia-database.json');
const largeLibraryToSuggestion = require('./library-suggestions.json');

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
    '[Learn more](https://developers.google.com/web/fundamentals/performance/webpack/decrease-frontend-size#optimize_dependencies).',
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
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    /** @type {Array<{
     * original: {name: string, version: string, gzip: number, description: string, repository: string},
     * suggestion: {name: string, version: string, gzip: number, description: string, repository: string}
     * }>} */
    const libraryPairings = [];
    const foundLibraries = artifacts.Stacks.filter(stack => stack.detector === 'js');

    const seenLibraries = new Set();

    for (const library of foundLibraries) {
      if (!library.npm || !largeLibraryToSuggestion[library.npm]) continue;
      if (seenLibraries.has(library.npm)) continue;
      seenLibraries.add(library.npm);

      if (library.version && bundlePhobiaStats[library.npm][library.version]) {
        largeLibraryToSuggestion[library.npm].map(librarySuggestionName => {
          libraryPairings.push({
            original: bundlePhobiaStats[library.npm][library.version],
            suggestion: bundlePhobiaStats[librarySuggestionName]['latest'],
          });
        });
      } else {
        largeLibraryToSuggestion[library.npm].map(librarySuggestionName => {
          libraryPairings.push({
            original: bundlePhobiaStats[library.npm]['latest'],
            suggestion: bundlePhobiaStats[librarySuggestionName]['latest'],
          });
        });
      }
    }

    const tableDetails = [];
    libraryPairings.map(libraryPairing => {
      tableDetails.push({
        name: libraryPairing.original.name,
        suggestion: libraryPairing.suggestion.name,
        savings: ((libraryPairing.original.gzip - libraryPairing.suggestion.gzip) / 1024).
                    toFixed(2) + ' KiB',
        originalURL: libraryPairing.original.repository,
        suggestionURL: libraryPairing.suggestion.repository,
      });
    });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'name', itemType: 'text', text: str_(UIStrings.name)},
      {key: 'suggestion', itemType: 'text', text: str_(UIStrings.suggestion)},
      {key: 'savings', itemType: 'text', text: str_(i18n.UIStrings.columnWastedBytes)},
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
