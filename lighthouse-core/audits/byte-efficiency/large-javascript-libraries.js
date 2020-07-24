/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview This audit checks a page for any large JS libraries with smaller alternatives.
 * These libraries can be replaced with functionally equivalent, smaller ones.
 */

'use strict';

/** @typedef {{name: string, gzip: number, repository: string}} BundlePhobiaLibrary */

/** @type {Record<string, Record<string, BundlePhobiaLibrary>>} */
const libStats = require('./bundlephobia-database.json');

/** @type {Record<string, string[]>} */
const librarySuggestions = require('./library-suggestions.js').suggestions;

const Audit = require('../audit.js');
const i18n = require('../../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on large Javascript libraries that are used on the page that have better alternatives. This descriptive title is shown when to users when no known unnecessarily large libraries are detected on the page.*/
  title: 'Avoids unnecessarily large JavaScript libraries',
  /** Title of a Lighthouse audit that provides detail on large Javascript libraries that are used on the page that have better alternatives. This descriptive title is shown when to users when some known unnecessarily large libraries are detected on the page.*/
  failureTitle: 'Replace unnecessarily large JavaScript libraries',
  /** Description of a Lighthouse audit that tells the user why they should care about the large Javascript libraries that have better alternatives. This is displayed after a user expands the section to see more. No character length limits. */
  description: 'Large JavaScript libraries can lead to poor performance. ' +
    'Prefer smaller, functionally equivalent libraries to reduce your bundle size.' +
    ' [Learn more](https://developers.google.com/web/fundamentals/performance/webpack/decrease-frontend-size#optimize_dependencies).',
  /** Label for a column in a data table. Entries will be names of large JavaScript libraries that could be replaced. */
  name: 'Library',
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
    /** @type {Array<{original: BundlePhobiaLibrary, suggestions: BundlePhobiaLibrary[]}>} */
    const libraryPairings = [];
    const detectedLibs = artifacts.Stacks.filter(stack => stack.detector === 'js');

    const seenLibraries = new Set();

    for (const detectedLib of detectedLibs) {
      if (!detectedLib.npm || !libStats[detectedLib.npm]) continue;
      const suggestions = librarySuggestions[detectedLib.npm] || [];

      if (seenLibraries.has(detectedLib.npm)) continue;
      seenLibraries.add(detectedLib.npm);

      let version = 'latest';
      if (detectedLib.version && libStats[detectedLib.npm][detectedLib.version]) {
        version = detectedLib.version;
      }

      const originalLib = libStats[detectedLib.npm][version];
      let smallerSuggestions = suggestions.map(suggestion => {
        if (!libStats[suggestion]) return;
        if (libStats[suggestion]['latest'].gzip > originalLib.gzip) return;

        return {
          name: suggestion,
          repository: libStats[suggestion].repository,
          gzip: libStats[suggestion]['latest'].gzip,
        };
      });

      smallerSuggestions = [...smallerSuggestions].sort((a, b) => a.gzip - b.gzip);
      if (smallerSuggestions.length) {
        libraryPairings.push({
          original: {
            gzip: originalLib.gzip,
            name: detectedLib.npm,
            repository: libStats[detectedLib.npm].repository,
          },
          suggestions: smallerSuggestions,
        });
      }
    }

    const tableDetails = [];
    for (const libraryPairing of libraryPairings) {
      const original = libraryPairing.original;
      const suggestions = libraryPairing.suggestions;

      tableDetails.push({
        name: {
          text: original.name,
          url: original.repository,
          type: 'link',
        },
        size: original.gzip,
        savings: 0,
        subItems: {
          type: 'subitems',
          items: [],
        },
      });

      for (let i = 0; i < suggestions.length; i++) {
        tableDetails.push({
          name: {
            text: '',
            url: '',
            type: 'link',
          },
          size: suggestions[i].gzip,
          savings: original.gzip - suggestions[i].gzip,
          subItems: {
            type: 'subitems',
            items: [
              {
                suggestion: {
                  text: suggestions[i].name,
                  url: suggestions[i].repository,
                  type: 'link',
                },
              },
            ],
          },
        });
      }
    }

    /** @type {LH.Audit.Details.TableColumnHeading[]} */
    const headings = [
      /* eslint-disable max-len */
      {key: 'name', itemType: 'url', text: str_(UIStrings.name), subItemsHeading: {key: 'suggestion'}},
      {key: 'size', itemType: 'bytes', text: str_(i18n.UIStrings.columnTransferSize)},
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
