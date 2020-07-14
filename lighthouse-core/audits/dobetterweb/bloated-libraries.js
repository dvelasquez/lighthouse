/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview This audit checks a page for any unnecessarily large npm dependencies.
 * These "bloated" libraries can be replaced with functionally equivalent, smaller ones.
 */

'use strict';

const Audit = require('../audit.js');
const i18n = require('../../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that provides detail on the Javascript libraries that are used on the page. */
  title: 'Avoid bloated JavaScript dependencies',
  /** Description of a Lighthouse audit that tells the user what this audit is detecting. This is displayed after a user expands the section to see more. No character length limits. */
  description: 'These are suggestions for functionally equivalent library alternatives ' +
    'that can reduce your bundle size. [Learn more](https://web.dev/bloated-libraries/)',
  suggestion: 'Suggestion',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

class BloatedLibrariesAudit extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'bloated-libraries',
      title: str_(UIStrings.title),
      description: str_(UIStrings.description),
      requiredArtifacts: ['Stacks'],
    };
  }

  /**
   * If the given library is bloated, adds a library/suggestion pairing to libraryPairings.
   * @param {LH.Artifacts.DetectedStack} library
   * @param {object[]} libraryPairings
   */
  static searchBloatedDatabase(library, libraryPairings) {
    const database = {'moment': 'dayjs'};

    if (library.npm && database[library.npm]) {
      libraryPairings.push({original: library, suggestion: {name: database[library.npm]}});
    }
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const libraryPairings = [];

    const foundLibraries = artifacts.Stacks.filter(stack => stack.detector === 'js');
    foundLibraries.forEach(library => this.searchBloatedDatabase(library, libraryPairings));

    const tableDetails = [];
    libraryPairings.forEach(libraryPairing => {
      tableDetails.push({
        name: libraryPairing.original.name,
        suggestion: libraryPairing.suggestion.name,
      });
    });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'name', itemType: 'text', text: str_(i18n.UIStrings.columnName)},
      {key: 'suggestion', itemType: 'text', text: str_(UIStrings.suggestion)},
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

module.exports = BloatedLibrariesAudit;
module.exports.UIStrings = UIStrings;
