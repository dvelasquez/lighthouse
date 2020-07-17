/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

const suggestions = [
  // general-purpose-date-time
  [
    'moment',
    'dayjs',
    'date-fns',
    'luxon',
  ],

  // deep-equal
  [
    'fast-deep-equal',
    'deep-eql',
    'deep-equal',
    'lodash.isequal',
  ],

  // schema-validation
  [
    'jsonschema',
    'joi',
    'ajv',
    'superstruct',
    'yup',
    'validate.js',
  ],

  // querystring-parser
  [
    'qs',
    'query-string',
    'querystringify',
    'querystring',
  ],

  // timezone-formatting
  [
    'moment-timezone',
    'date-time-format-timezone',
    'spacetime',
    'date-fns-timezone',
  ],

  // uuid
  [
    'uuid',
    'shortid',
    'nanoid',
    'cuid',
  ],

  // promise-polyfill
  [
    'promise',
    'es6-promise',
    'promise-polyfill',
    'es6-promise-polyfill',
  ],

  // immutable-data-structures
  [
    'immutable',
    'seamless-immutable',
    'immutability-helper',
    'baobab',
  ],

  // memoization
  [
    'memoize',
    'memoize-one',
    'lodash.memoize',
    'mem',
    'fast-memoize',
  ],

  // node-http-request
  [
    'got',
    'phin',
    'axios',
    'superagent',
  ],

  // number-manipulation
  [
    'numeral',
    'numbro',
    'accounting',
    'currency.js',
  ],
];

module.exports = {suggestions};
