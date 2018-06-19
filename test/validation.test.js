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
  function validationResultsSorter(lhs, rhs) {
    if (lhs instanceof ValidationResult && rhs instanceof ValidationResult) {
      return lhs.compareValidation(rhs);
    }
    throw 'Only able to sort ValidationResult instances';
  }

  function areValidationResultsEqual_generalErrorsAdapter(lhs, rhs) {
    if (lhs.conditionalBlockId === consts.VALIDATION_UNASSIGNED_INDEX &&
        rhs.conditionalBlockId === consts.VALIDATION_UNASSIGNED_INDEX &&
        lhs.innerBlockOrder === consts.VALIDATION_UNASSIGNED_INDEX &&
        rhs.innerBlockOrder === consts.VALIDATION_UNASSIGNED_INDEX) {
      return true;
    }
    return areValidationResultsEqualIgnoreDetails(lhs, rhs);
  }


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
      const expectedValidationResults = testObj[consts.VALIDATE_OUTPUT_KEY_STR].sort(validationResultsSorter);
      const maxClausesPerBlock = testObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK];
      const maxBlocksPerTemplate = testObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE];
      const attrs = testObj[consts.ATTRIBUTES_KEY_STR];
      const comparisonFunc = testObj[tstConsts.CUSTOM_COMPARATOR_KEY] || areValidationResultsEqualIgnoreDetails;

      it(tstMsg, () => {
        const result = translator.translate(testInputStr, attrs, true, maxClausesPerBlock, maxBlocksPerTemplate);
        const actualValidationResults = result[consts.VALIDATE_OUTPUT_KEY_STR].sort(validationResultsSorter);
        expect(_.differenceWith(expectedValidationResults, actualValidationResults, comparisonFunc).length).to.equal(0);
        expect(_.differenceWith(actualValidationResults, expectedValidationResults, comparisonFunc).length).to.equal(0);
      });
    });
  }

  function addToValidationTests(msgToAdd, inputToAdd, resultsToAdd, attrsObj = generateEmptyLegalAttrs(), maxClausesPerBlock = null, maxBlocksPerTemplate = null, comparatorFunc = areValidationResultsEqualIgnoreDetails) {
    const tstObj = {};
    tstObj[tstConsts.TST_MSG_KEY] = msgToAdd;
    tstObj[tstConsts.INPUT_KEY] = inputToAdd;
    tstObj[consts.VALIDATE_OUTPUT_KEY_STR] = resultsToAdd;
    tstObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK] = maxClausesPerBlock;
    tstObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE] = maxBlocksPerTemplate;
    tstObj[consts.ATTRIBUTES_KEY_STR] = attrsObj;
    tstObj[tstConsts.CUSTOM_COMPARATOR_KEY] = comparatorFunc;
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
  let inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text}`;
  let res = new ValidationResult(
    consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
    `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER}`, `${consts.VALIDATION_BLOCK_MSG} - missing required closing clause ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`,
  );
  addToValidationTests(`Should return a ${res.errorMsg} - missing ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`, inputStr, [res]);


  // More blocks than allowed
  inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

  inputStr = `${inputStr} ${inputStr} ${inputStr}`;
  const maxAllowedCondBlocksNum = 2;
  const validationMsg = `${consts.VALIDATION_BLOCK_MSG}: block #${maxAllowedCondBlocksNum + 1} exceeds max number of allowed blocks: ${maxAllowedCondBlocksNum}`;
  res = new ValidationResult(
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
      inputStr = `                                                                                                                                                        
                   ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curKey}>200${consts.CUSTOM_CLOSE_DELIMITER} body ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
      addToValidationTests(`Valid prefixes checked: ${curKey}`, inputStr, [], { [curKey]: '' });
    });
  });

  // Operators testing (both legal & illegal)
  consts.LEGAL_OPERATORS.forEach((op) => {
    inputStr = `
               ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}${op}200${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    addToValidationTests(`Legal operator: ${op}`, inputStr, []);
  });
  const illegalOps = ['=', '=!', '=!!', '=!!!', '!', '!!'];
  illegalOps.forEach((op) => {
    inputStr = `
               ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}${op}200${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    let invalidCond = inputStr.substring(
      0,
      inputStr.indexOf(consts.CUSTOM_CLOSE_DELIMITER) + consts.CUSTOM_CLOSE_DELIMITER.length,
    );
    invalidCond = invalidCond.replace(consts.CUSTOM_CLOSE_DELIMITER, '').replace(consts.CUSTOM_OPEN_DELIMITER, '').trim();
    res = new ValidationResult(
      consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
      invalidCond, consts.VALIDATION_COND_MSG,
    );
    addToValidationTests(`Illegal operator: ${op}`, inputStr, [res]);
  });

  // Invalid attribute
  const invalidAttr = 'ddddddddddddd';
  consts.LEGAL_OPERATORS.forEach((op) => {
    const invalidCond = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${invalidAttr}${consts.OP_EQ}'Italian'`.replace(consts.CUSTOM_OPEN_DELIMITER, '');
    inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${invalidCond}${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    res = new ValidationResult(
      consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
      invalidCond, consts.VALIDATION_COND_MSG,
    );
    addToValidationTests(`Invalid attribute (legal operator: ${op})`, inputStr, [res]);
  });

  // Invalid block order - simple
  const elseifBlock = `${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}${consts.OP_EQ}'English'${consts.CUSTOM_CLOSE_DELIMITER}`;
  const elseifFirstInputStr = `${elseifBlock} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  res = new ValidationResult(consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX, elseifBlock, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG);
  addToValidationTests(`Invalid block order: ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX} before IF`, elseifFirstInputStr, [res]);

  const elseFirstInputStr = `${consts.CUSTOM_ELSE_BLOCK_TAG} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  res = new ValidationResult(
    consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
    consts.CUSTOM_ELSE_BLOCK_TAG, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG,
  );
  addToValidationTests(`Invalid block order: ${consts.CUSTOM_ELSE_BLOCK_TAG} before IF`, elseFirstInputStr, [res]);


  inputStr = `[%IF:<span style='color: rgb(0, 0, 0); font-family: "Times New Roman"; font-size: medium; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;'>CAMPAIGN_ID > 5</span>%]</p>
  <p>Специальное предложение отправлено на адрес РоманаSpecial offer sent to Roman's email</p>
  <p>[%END:IF%]</p>
  <p>[%ELSEIF:EMAIL=='haimi_g@optimove.com'%]</p>
  <p>Oferta especial enviada al correo electrónico de Haimi</p>
  <p>[%END:IF%]</p>
  <p>[%ELSEIF:EMAIL=='inna_o@optimove.com'%]</p>
  <p>Special offer sent to Inna's email [%END:IF%]</p>
  <p>[%ELSE%]Special offer sent to your email[%END:IF%]`;
  const jsonizedAttrs = `{
  "span style='color: rgb(0, 0, 0); font-family: \\\"Times New Roman\\\"; font-size: medium; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;'>CAMPAIGN_ID > 5": "",
  "EMAIL": "",
  "ELSE": ""
  }`;
  const attrs = JSON.parse(jsonizedAttrs);
  const errors = [new ValidationResult(),
    new ValidationResult(
      consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
      `IF:<SPAN STYLE='COLOR: RGB(0, 0, 0); FONT-FAMILY: "TIMES NEW ROMAN"; FONT-SIZE: MEDIUM; FONT-STYLE: NORMAL; FONT-VARIANT-LIGATURES: NORMAL; FONT-VARIANT-CAPS: NORMAL; FONT-WEIGHT: 400; LETTER-SPACING: NORMAL; ORPHANS: 2; TEXT-ALIGN: START; TEXT-INDENT: 0PX; TEXT-TRANSFORM: NONE; WHITE-SPACE: NORMAL; WIDOWS: 2; WORD-SPACING: 0PX; -WEBKIT-TEXT-STROKE-WIDTH: 0PX; TEXT-DECORATION-STYLE: INITIAL; TEXT-DECORATION-COLOR: INITIAL; DISPLAY: INLINE !IMPORTANT; FLOAT: NONE;'>CAMPAIGN_ID > 5</SPAN>`,
      consts.VALIDATION_COND_MSG,
    )];

  addToValidationTests('Literal Tst - checking general translation error', inputStr, errors, attrs, 10, 10, areValidationResultsEqual_generalErrorsAdapter);

  /*
  const isCustomer1StrA = `              <!--BEGIN ec_Ad-->              <a href="https://www.californiapsychics.com/buy-package?utm_source=optimove&utm_medium=newsletter&utm_campaign=optimove_n_oa_all_dailynewsletter-[%LOWER:LAST_PROMO_SENT%]&utm_term=[%CURRENT_DATE:yyyyMMdd%]" style="text-decoration:none;" target="_blank"><img src="http://news.californiapsychics.com/newsletter/ec_ads/ec_a_[%LOWER:LAST_PROMO_SENT%].jpg?v=[%CURRENT_DATE:yyyyMMdd%]" alt="Get Answers Today" border="0" style="font-family:Arial, sans-serif;font-size:1px;color:#f6f7fb;overflow:hidden;mso-line-height-rule:exactly;line-height:1px;width:100%;height:auto;display:block;" class="fr-draggable"></a>              <!--END ec_Ad-->`;
  const isCustomerNot1StrA = `              <!--BEGIN subAd-->              <a href="https://www.californiapsychics.com/psychic-readings?utm_source=optimove&utm_medium=newsletter&utm_campaign=optimove_n_oa_all_dailynewsletter-nonc-[%NEWS_NON_CUSTOMER_DAY%]&utm_term=[%CURRENT_DATE:yyyyMMdd%]" style="text-decoration:none;" target="_blank"><img src="http://news.californiapsychics.com/newsletter/sub_ads/[%NEWS_NON_CUSTOMER_DAY%]_a_300nl.jpg?v=[%CURRENT_DATE:yyyyMMdd%]" alt="Get Answers Today" border="0" style="font-family:Arial, sans-serif;font-size:1px;color:#f6f7fb;overflow:hidden;mso-line-height-rule:exactly;line-height:1px;width:100%;height:auto;display:block;" class="fr-draggable"></a>              <!--END subAd-->`;
  const middleStr = ` </td>             <td align="center" style="padding:0 0 0 0;margin:0 0 0 0;max-width:300px;" valign="top" width="300"> `;
  const isCustomer1StrB = `              <!--BEGIN ec_Ad-->              <a href="https://www.californiapsychics.com/buy-package?utm_source=optimove&utm_medium=newsletter&utm_campaign=optimove_n_oa_all_dailynewsletter-[%LOWER:LAST_PROMO_SENT%]&utm_term=[%CURRENT_DATE:yyyyMMdd%]" style="text-decoration:none;" target="_blank"><img src="http://news.californiapsychics.com/newsletter/ec_ads/ec_b_[%LOWER:LAST_PROMO_SENT%].jpg?v=[%CURRENT_DATE:yyyyMMdd%]" alt="Start Now" border="0" style="font-family:Arial, sans-serif;font-size:1px;color:#f6f7fb;overflow:hidden;mso-line-height-rule:exactly;line-height:1px;width:100%;height:auto;display:block;" class="fr-draggable"></a>              <!--END ec_Ad-->`;
 const isCustomerNot1StrB = `              <!--BEGIN subAd-->              <a href="https://www.californiapsychics.com/psychic-readings?utm_source=optimove&utm_medium=newsletter&utm_campaign=optimove_n_oa_all_dailynewsletter-nonc-[%NEWS_NON_CUSTOMER_DAY%]&utm_term=[%CURRENT_DATE:yyyyMMdd%]" style="text-decoration:none;" target="_blank"><img src="http://news.californiapsychics.com/newsletter/sub_ads/[%NEWS_NON_CUSTOMER_DAY%]_b_300nl.jpg?v=[%CURRENT_DATE:yyyyMMdd%]" alt="Start Now" border="0" style="font-family:Arial, sans-serif;font-size:1px;color:#f6f7fb;overflow:hidden;mso-line-height-rule:exactly;line-height:1px;width:100%;height:auto;display:block;" class="fr-draggable"></a>              <!--END subAd-->`;
  inputStr = `[%IF:IS_CUSTOMER==1%]${isCustomer1StrA}[%END:IF%] [%ELSE%]${isCustomerNot1StrA}[%END:IF%]${middleStr}[%IF:IS_CUSTOMER==1%]${isCustomer1StrB}[%END:IF%] [%ELSE%]${isCustomerNot1StrB}[%END:IF%]`;
  const isCustomerVals = [0, 1];
  isCustomerVals.forEach(
      value =>
      {

      }
  );
*/
  // todo - add tests with dateime alias (DATE_FORAMT, TIME_FORMAT) - take them from key dateimeHelper.DATETIME_DEF_FORMAT_ALIAS_KEY in datetimeHelper.DateTimeObjList

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
