/* eslint-disable no-param-reassign */


const expect = require('chai').expect;
const _ = require('lodash');
const moment = require('moment');
const translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');
const tagPrefixes = require('../lib/tagPrefixes.js');
const ValidationResult = require('../lib/validationResult.js');
const CondFormatter = require('../lib/formatter');

describe('General Validation Tests', () => {
  function areValidationResultsEqual(lhs, rhs) {
    if (rhs == null) {
      return lhs == null;
    } else if (lhs == null) {
      return false;
    }

    return lhs.isValidationEqual(rhs);
  }

  function areValidationResultsEqualIgnoreDetails(lhs, rhs) {
    if (lhs && lhs.details) {
      lhs.details = '';
    }

    if (rhs && rhs.details) {
      rhs.details = '';
    }
    return areValidationResultsEqual(lhs, rhs);
  }
  const ORDER_KEY = 'ORDER_VALUE';
  const LANGUAGE_KEY = 'LANGUAGE';
  const FAV_PROD_KEY = 'FAVORITE_PRODUCT';
  const ALL_ATTRS_KEYS = [ORDER_KEY, LANGUAGE_KEY, FAV_PROD_KEY];

  function generateEmptyLegalAttrs(defaultVal = '') {
    const attrsObj = {};
    ALL_ATTRS_KEYS.forEach((attrKey) => {
      attrsObj[attrKey] = defaultVal;
    });
    return attrsObj;
  }

  const tstObjs = [];

  function executeGeneralValidationTests() {
    tstObjs.forEach((testObj) => {
      const tstMsg = testObj[tstConsts.TST_MSG_KEY];
      const testInputStr = testObj[tstConsts.INPUT_KEY];
      const expectedValidationResults = testObj[consts.VALIDATE_OUTPUT_KEY_STR];
      const maxClausesPerBlock = testObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK];
      const maxBlocksPerTemplate = testObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE];
      const attrs = testObj[consts.ATTRIBUTES_KEY_STR];


      it(tstMsg, () => {
        const result = translator.translate(testInputStr, attrs, true, maxClausesPerBlock, maxBlocksPerTemplate);
        const actualValidationResults = result[consts.VALIDATE_OUTPUT_KEY_STR];
        expect(_.differenceWith(expectedValidationResults, actualValidationResults, areValidationResultsEqualIgnoreDetails).length).to.equal(0);
        expect(_.differenceWith(actualValidationResults, expectedValidationResults, areValidationResultsEqualIgnoreDetails).length).to.equal(0);
      });
    });
  }

  function addToValidationTests(msgToAdd, inputToAdd, resultsToAdd, attrsObj = generateEmptyLegalAttrs(), maxClausesPerBlock = null, maxBlocksPerTemplate = null) {
    const tstObj = {};
    tstObj[tstConsts.TST_MSG_KEY] = msgToAdd;
    tstObj[tstConsts.INPUT_KEY] = inputToAdd;
    tstObj[consts.VALIDATE_OUTPUT_KEY_STR] = resultsToAdd;
    tstObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK] = maxClausesPerBlock;
    tstObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE] = maxBlocksPerTemplate;
    tstObj[consts.ATTRIBUTES_KEY_STR] = attrsObj;

    tstObjs.push(tstObj);
  }

  addToValidationTests('should return empty validation list', '', []);

  const sectionsPerValue = {
    orderGT200Text: 'Order greater than 200',
    orderLTOE200Text: 'Order less than or equal to 200',
    orderGT100LT200Text: 'Order greater than 100 and less than 200',
    orderLT100Text: 'Order less than 100',
    orderNNText: 'Order non-negative',
    orderNText: 'Order negative',
    languageEnglishText: 'Content for English',
    languageNotEnglishText: 'Content not for English',
    languageSpanishText: 'Content for Spanish',
    languageNotSpanishText: 'Content not for Spanish',
    languageItalianText: 'Content for Italian',
    favProductExistenceText: `Your favorite product: ${consts.CUSTOM_OPEN_DELIMITER}${FAV_PROD_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`,
    favProductNonExistenceText: 'No favorite product',
  };

    // A single [%END:IF%} missing
  var inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text}`;
  var res = new ValidationResult(
    consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
    `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER}`, `${consts.VALIDATION_BLOCK_MSG} - missing required closing clause ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`,
  );
  addToValidationTests(`Should return a ${res.errorMsg} - missing ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`, inputStr, [res]);


  // More blocks than allowed
  var inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

  inputStr = `${inputStr} ${inputStr} ${inputStr}`;
  const maxAllowedCondBlocksNum = 2;
  const validationMsg = `${consts.VALIDATION_BLOCK_MSG}: block #${maxAllowedCondBlocksNum + 1} exceeds max number of allowed blocks: ${maxAllowedCondBlocksNum}`;
  var res = new ValidationResult(
    maxAllowedCondBlocksNum, consts.VALIDATION_START_INDEX,
    `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER}`, validationMsg,
  );
  addToValidationTests(`Should return: ${res.errorMsg}`, inputStr, [res], generateEmptyLegalAttrs(), 999, maxAllowedCondBlocksNum);


  // Compound valid tag prefixes
  tagPrefixes.PersonalizationTypesPrefixes.forEach((prefix) => {
    const curKeys = [`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A`,
      `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B`,
      `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B${consts.LOGICAL_CONDITION_DELIMITER}C`,
    ];
    curKeys.forEach((curKey) => {
      const inputStr = `                                                                                                                                                        
                   ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curKey}>200${consts.CUSTOM_CLOSE_DELIMITER} body ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
      addToValidationTests(`Valid prefixes checked: ${curKey}`, inputStr, [], { [curKey]: '' });
    });
  });

  // Operators testing (both legal & illegal)
  consts.LEGAL_OPERATORS.forEach((op) => {
    const inputStr = `
               ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}${op}200${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    addToValidationTests(`Legal operator: ${op}`, inputStr, []);
  });
  const illegalOps = ['=', '=!', '=!!', '=!!!', '!', '!!'];
  illegalOps.forEach((op) => {
    const inputStr = `
               ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}${op}200${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    let invalidCond = inputStr.substring(0,
      inputStr.indexOf(consts.CUSTOM_CLOSE_DELIMITER) + consts.CUSTOM_CLOSE_DELIMITER.length,
    );
    invalidCond = invalidCond.replace(consts.CUSTOM_CLOSE_DELIMITER, '').replace(consts.CUSTOM_OPEN_DELIMITER, '').trim();
    const res = new ValidationResult(
      consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
      invalidCond, consts.VALIDATION_COND_MSG,
    );
    addToValidationTests(`Illegal operator: ${op}`, inputStr, [res]);
  });

  // Invalid attribute
  const invalidAttr = 'ddddddddddddd';
  consts.LEGAL_OPERATORS.forEach((op) => {
    const invalidCond = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${invalidAttr}${consts.OP_EQ}'Italian'`.replace(consts.CUSTOM_OPEN_DELIMITER, '');
    const inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${invalidCond}${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    const res = new ValidationResult(
      consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
      invalidCond, consts.VALIDATION_COND_MSG,
    );
    addToValidationTests(`Invalid attribute (legal operator: ${op})`, inputStr, [res]);
  });

  // Invalid block order - simple
  const elseifBlock = `${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER}`;
  const elseifFirstInputStr = `${elseifBlock} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  var res = new ValidationResult(consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX, elseifBlock, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG);
  addToValidationTests(`Invalid block order: ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX} before IF`, elseifFirstInputStr, [res]);

  const elseFirstInputStr = `${consts.CUSTOM_ELSE_BLOCK_TAG} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  res = new ValidationResult(
    consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
    consts.CUSTOM_ELSE_BLOCK_TAG, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG,
  );
  addToValidationTests(`Invalid block order: ${consts.CUSTOM_ELSE_BLOCK_TAG} before IF`, elseFirstInputStr, [res]);

  /*
  // DateTime - non-explicit tags
  const datetimeKey = 'datetimeAttr';
  const datetimeVal1 = moment();
  const formatter = new CondFormatter();
*/

    // DateTime - explicit tags

  /*
    var inputStr = `
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var res = new ValidationResult(consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
        `${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER}`,
        consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG);
    addToValidationTests(`Invalid block order: ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX} before IF`, `${inputStr} ${in}`, [res]);

*/
  // Invalid block order - compound (meaning smthing like if.... else... elseif / if...else...else)
  // TODO...

  executeGeneralValidationTests();
});
