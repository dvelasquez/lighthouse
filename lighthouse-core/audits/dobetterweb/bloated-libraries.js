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
  description: 'These libraries have functionally equivalent, smaller alternatives' +
    'that can reduce your bundle size when replaced. [Learn more](https://web.dev/bloated-libraries/)',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);
