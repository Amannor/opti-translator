/* eslint-disable max-len */
const { expect } = require('chai');
const moment = require('moment');
const translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');
const tagPrefixes = require('../lib/tagPrefixes.js');
const datetimeHelper = require('../lib/datetimeHelper.js');

/* global describe */
/* global it */
describe('General Translator Tests', () => {
  it('should return empty string', () => {
    const result = translator.translate('');
    expect(result[consts.OUTPUT_KEY_STR]).to.equal('');
  });

  const ORDER_KEY = 'ORDER_VALUE';
  const LANGUAGE_KEY = 'LANGUAGE';
  const FAV_PROD_KEY = 'FAVORITE_PRODUCT';
  const ALL_ATTRS_KEYS = [ORDER_KEY, LANGUAGE_KEY, FAV_PROD_KEY];

  function generalTests(testObjs) {
    testObjs.forEach((testObj) => {
      const tstMsg = testObj[tstConsts.TST_MSG_KEY];
      const testData = testObj[tstConsts.INPUT_KEY];
      const attrs = testData[consts.ATTRIBUTES_KEY_STR];
      ALL_ATTRS_KEYS.forEach((attrKey) => {
        if (!(attrKey in attrs)) { attrs[attrKey] = ''; }
      });
      it(tstMsg, () => {
        const result = translator.translate(testData[tstConsts.INPUT_KEY], attrs, true);
        expect(result[consts.OUTPUT_KEY_STR].trim()).to.equal(testObj[tstConsts.CORRECT_RESULT_KEY].trim());
        const validationResults = result[consts.VALIDATE_OUTPUT_KEY_STR] || [];
        expect(validationResults.length).to.equal(0);
      });
      it(`${tstMsg} - brackets transformation in attrs keys`, () => {
        const transformedAttrs = {};
        Object.keys(attrs).forEach((attrKey) => {
          const newKey = (attrKey.startsWith(consts.CUSTOM_OPEN_DELIMITER) && attrKey.endsWith(consts.CUSTOM_CLOSE_DELIMITER)) ?
            attrKey.replace(consts.CUSTOM_OPEN_DELIMITER, '').replace(consts.CUSTOM_CLOSE_DELIMITER, '') :
            `${consts.CUSTOM_OPEN_DELIMITER}${attrKey}${consts.CUSTOM_CLOSE_DELIMITER}`;
          transformedAttrs[newKey] = attrs[attrKey];
        });
        const result = translator.translate(testData[tstConsts.INPUT_KEY], transformedAttrs, true);
        expect(result[consts.OUTPUT_KEY_STR].trim()).to.equal(testObj[tstConsts.CORRECT_RESULT_KEY].trim());
        const validationResults = result[consts.VALIDATE_OUTPUT_KEY_STR] || [];
        expect(validationResults.length).to.equal(0);
      });
    });
  }

  const testCases = [];
  function addToTestCases(inputObjToAdd, correctResultToAdd, tstMsgToAdd) {
    const tstObj = {};
    tstObj[tstConsts.INPUT_KEY] = inputObjToAdd;
    tstObj[tstConsts.CORRECT_RESULT_KEY] = correctResultToAdd;
    tstObj[tstConsts.TST_MSG_KEY] = tstMsgToAdd;
    testCases.push(tstObj);
  }

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

  // Existence testing

  const inputPageExistenceTst = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${FAV_PROD_KEY}${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.favProductExistenceText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
    ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.favProductNonExistenceText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  const inputObjForExistenceTst = { [tstConsts.INPUT_KEY]: inputPageExistenceTst, [consts.ATTRIBUTES_KEY_STR]: { [FAV_PROD_KEY]: 'Lorem ipsum prod' } };
  addToTestCases(inputObjForExistenceTst, sectionsPerValue.favProductExistenceText, `Existence tst - key (${FAV_PROD_KEY}) exists`);

  // orders
  const inputPageOrders = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${ORDER_KEY}>100${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT100LT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.orderLT100Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  const possibleOrderVals = [-5, 0, 50, 100, 150, 200, 250];

  possibleOrderVals.forEach((orderVal) => {
    const OrderValAttrs = { [ORDER_KEY]: orderVal };
    const inputObj = { [tstConsts.INPUT_KEY]: inputPageOrders, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
    const OrdersCorrectResult = orderVal > 200 ? sectionsPerValue.orderGT200Text :
      orderVal > 100 ? sectionsPerValue.orderGT100LT200Text :
        sectionsPerValue.orderLT100Text;
    addToTestCases(inputObj, OrdersCorrectResult, `should return string according to order value: ${orderVal}`);
  });
  // orders - not all if blocks have respective ifelse \ else blocks
  const inputPageOrdersNoElse1 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}<=200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderLTOE200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

  possibleOrderVals.forEach((orderVal) => {
    const OrderValAttrs = { [ORDER_KEY]: orderVal };
    const inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse1, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
    const OrdersCorrectResult = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text : '';
    addToTestCases(inputObj, OrdersCorrectResult, `should return string (no else test#1) according to order value: ${orderVal}`);
  });

  const inputPageOrdersNoElse2 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}<=200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderLTOE200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
         ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${ORDER_KEY}>100${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT100LT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  possibleOrderVals.forEach((orderVal) => {
    const OrderValAttrs = { [ORDER_KEY]: orderVal };
    const inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse2, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
    const OrdersCorrectResult = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text :
      orderVal > 100 ? sectionsPerValue.orderGT100LT200Text : '';
    addToTestCases(inputObj, OrdersCorrectResult, `should return string (no else test#2) according to order value: ${orderVal}`);
  });

  const inputPageOrdersNoElse3 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>=0${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderNNText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG} ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.orderNText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  possibleOrderVals.forEach((orderVal) => {
    const OrderValAttrs = { [ORDER_KEY]: orderVal };
    const inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse3, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
    const OrdersCorrectResult = orderVal >= 0 ? sectionsPerValue.orderNNText :
      sectionsPerValue.orderNText;
    addToTestCases(inputObj, OrdersCorrectResult, `should return string (non\negative) according to order value: ${orderVal}`);
  });

  const inputPageOrdersNoElse4 =
        `${inputPageOrdersNoElse1} ${inputPageOrdersNoElse3}`;
  possibleOrderVals.forEach((orderVal) => {
    const OrderValAttrs = { [ORDER_KEY]: orderVal };
    const inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse4, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
    const OrdersCorrectResult1 = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text : '';
    const OrdersCorrectResult2 = orderVal >= 0 ? sectionsPerValue.orderNNText :
      ` ${sectionsPerValue.orderNText}`;
    addToTestCases(inputObj, `${OrdersCorrectResult1}   ${OrdersCorrectResult2}`, `should return string  (compound no else) according to order value: ${orderVal}`);
  });

  // Whitespace #1
  const INPUT_PAGE_WHITESPACES = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}       ${LANGUAGE_KEY}\n==     'English'   ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}\n${LANGUAGE_KEY}\t\t\t!=\n\n  'Italian'   ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPEN_DELIMITER}    ELSE \n\t${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_OPEN_DELIMITER} END  \t ${consts.LOGICAL_CONDITION_DELIMITER}  \nIF   ${consts.CUSTOM_CLOSE_DELIMITER}`;
  var possibleLanguageVals = ['Italian', 'Spanish', 'English'];
  possibleLanguageVals.forEach((langVal) => {
    const langsAttrs = { [LANGUAGE_KEY]: langVal };
    const inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_WHITESPACES, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
    const LangsCorrectResult = langVal === 'English' ? sectionsPerValue.languageEnglishText :
      langVal !== 'Italian' ? sectionsPerValue.languageSpanishText :
        sectionsPerValue.languageItalianText;
    addToTestCases(inputObj, LangsCorrectResult, `Whitespace test - should return string according to language value: ${langVal}`);
  });

  // Languages
  var INPUT_PAGE_LANGUAGE = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${LANGUAGE_KEY}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  var possibleLanguageVals = ['Spanish', 'englIsh', 'Italian'];

  possibleLanguageVals.forEach((langVal) => {
    const langsAttrs = { [LANGUAGE_KEY]: langVal };
    const inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
    const LangsCorrectResult = langVal.toUpperCase() === 'English'.toUpperCase() ? sectionsPerValue.languageEnglishText :
      langVal.toUpperCase() !== 'Italian'.toUpperCase() ? sectionsPerValue.languageSpanishText :
        sectionsPerValue.languageItalianText;
    addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value: ${langVal}`);
  });

  // Languages - [%%] in attrs key
  var possibleLanguageVals = ['Spanish', 'englIsh', 'Italian'];
  possibleLanguageVals.forEach((langVal) => {
    const langsAttrs = { [`${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal };
    const inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
    const LangsCorrectResult = langVal.toUpperCase() === 'English'.toUpperCase() ? sectionsPerValue.languageEnglishText :
      langVal.toUpperCase() !== 'Italian'.toUpperCase() ? sectionsPerValue.languageSpanishText :
        sectionsPerValue.languageItalianText;
    addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value ( ${consts.CUSTOM_OPEN_DELIMITER}${consts.CUSTOM_CLOSE_DELIMITER} in key): ${langVal}`);
  });


  // Languages - duplicate attrs key - (with & without [%%])
  var INPUT_PAGE_LANGUAGE = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${LANGUAGE_KEY}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  var possibleLanguageVals = ['Spanish', 'englIsh', 'Italian'];
  possibleLanguageVals.forEach((langVal) => {
    const langsAttrs = {
      [`${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal,
      [`${LANGUAGE_KEY}`]: langVal,
    };
    const inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
    const LangsCorrectResult = langVal.toUpperCase() == 'English'.toUpperCase() ? sectionsPerValue.languageEnglishText :
      langVal.toUpperCase() != 'Italian'.toUpperCase() ? sectionsPerValue.languageSpanishText :
        sectionsPerValue.languageItalianText;
    addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value: ${langVal} (duplicate attrs key - with & without ${consts.CUSTOM_OPEN_DELIMITER} ${consts.CUSTOM_CLOSE_DELIMITER})`);
  });

  // Languages - tag prefixes
  var possibleLanguageVals = ['Spanish', 'englIsh', 'Italian'];
  const possiblePrefixes = tagPrefixes.GetAllNonDatetimePrefixes();
  possiblePrefixes.forEach((tagPrefix) => {
    const prefixedLangKey = `${tagPrefix}${consts.LOGICAL_CONDITION_DELIMITER}${LANGUAGE_KEY}`;
    const prefixedInputPageLang = `
                ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${prefixedLangKey}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${prefixedLangKey}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

    possibleLanguageVals.forEach((langVal) => {
      const langsAttrs = { [`${consts.CUSTOM_OPEN_DELIMITER}${prefixedLangKey}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal };
      const inputObj = { [tstConsts.INPUT_KEY]: prefixedInputPageLang, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
      const LangsCorrectResult = langVal.toUpperCase() == 'English'.toUpperCase() ? sectionsPerValue.languageEnglishText :
        langVal.toUpperCase() != 'Italian'.toUpperCase() ? sectionsPerValue.languageSpanishText :
          sectionsPerValue.languageItalianText;
      addToTestCases(inputObj, LangsCorrectResult, `Tag prefixes test. Prefix: ${tagPrefix} langVal: ${langVal}`);
    });
  });

  // Compound valid tag prefixes
  tagPrefixes.PersonalizationTypesPrefixes.forEach((prefix) => {
    const curKeys = [`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A`,
      `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B`,
      `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B${consts.LOGICAL_CONDITION_DELIMITER}C`,
    ];
    curKeys.forEach((curKey) => {
      const inputStr = `                                                                                                                                                        
                   ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curKey}>200${consts.CUSTOM_CLOSE_DELIMITER} body ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
      const inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curKey]: 'placeholderVal' } };
      addToTestCases(inputObj, '', `should return empty result, checking that valid prefix (${curKey}) doesn't throw`);
    });
  });

  // DateTime
  let curDateKey = datetimeHelper.DateTags[0];
  let curDateClause = `${curDateKey}${consts.LOGICAL_CONDITION_DELIMITER}${datetimeHelper.dateFormats.y4}`;
  let inputStr = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curDateClause}${consts.OP_EQ}2017${consts.CUSTOM_CLOSE_DELIMITER}
    Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  let inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curDateClause]: 2017 } };
  addToTestCases(inputObj, 'Lorem ipsum', `Date test ${curDateClause}${consts.OP_EQ}2017 - sent value 2017`);
  inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curDateClause]: 2016 } };
  addToTestCases(inputObj, '', `Date test ${curDateClause}${consts.OP_EQ}2017 - sent value 2016`);

  curDateClause = `${curDateKey}${consts.LOGICAL_CONDITION_DELIMITER}${datetimeHelper.dateFormats.d2}`;
  inputStr = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curDateClause}${consts.OP_NEQ}06${consts.CUSTOM_CLOSE_DELIMITER}
    Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curDateClause]: 10 } };
  addToTestCases(inputObj, 'Lorem ipsum', `Date test ${curDateClause}${consts.OP_NEQ}06 - sent value 10`);

  curDateKey = 'BDAY';
  inputStr = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curDateKey}${consts.OP_LT}'11/14/2017'${consts.CUSTOM_CLOSE_DELIMITER}
    Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
  const curDateVal = moment().format(String.raw`MM/DD/YYYY`);
  inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj, '', `Date test ${curDateKey}${consts.OP_LT}'11/14/2017' - sent value ${curDateVal}`);

  const inputObj2 = { [tstConsts.INPUT_KEY]: inputStr.replace(consts.OP_LT, consts.OP_LTE), [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj2, '', `Date test ${curDateKey}${consts.OP_LTE}'11/14/2017' - sent value ${curDateVal}`);

  const inputObj3 = { [tstConsts.INPUT_KEY]: inputStr.replace(consts.OP_LT, consts.OP_GT), [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj3, 'Lorem ipsum', `Date test ${curDateKey}${consts.OP_GT}'11/14/2017' - sent value ${curDateVal}`);

  const inputObj4 = { [tstConsts.INPUT_KEY]: inputStr.replace(consts.OP_LT, consts.OP_GTE), [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj4, 'Lorem ipsum', `Date test ${curDateKey}${consts.OP_GTE}'11/14/2017' - sent value ${curDateVal}`);

  const inputObj5 = { [tstConsts.INPUT_KEY]: inputStr.replace(consts.OP_LT, consts.OP_EQ), [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj5, '', `Date test ${curDateKey}${consts.OP_EQ}'11/14/2017' - sent value ${curDateVal}`);

  const inputObj6 = { [tstConsts.INPUT_KEY]: inputStr.replace(consts.OP_LT, consts.OP_NEQ), [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: curDateVal } };
  addToTestCases(inputObj6, 'Lorem ipsum', `Date test ${curDateKey}${consts.OP_NEQ}'11/14/2017' - sent value ${curDateVal}`);
  //  inputStr = "[%IF:CURRENT_DATE:dd==06%]</p><p>=6 [%END:IF%]</p><p>[%ELSEIF:CURRENT_DATE:dd<06%]</p><p><6 [%END:IF%]</p><p>[%ELSEIF:CURRENT_DATE:dd>06%]</p><p>>6 [%END:IF%]</p><p>[%ELSEIF:CURRENT_DATE:dd!=06%]</p><p>!=6 [%END:IF%]</p><p>[%ELSE%]</p><p>DEFAULT [%END:IF%]\"

  // todo - add tests with dateime alias (DATE_FORAMT, TIME_FORMAT) - take them from key dateimeHelper.DATETIME_DEF_FORMAT_ALIAS_KEY in datetimeHelper.DateTimeObjList

  const inputPrefix = '\n\n\t Your Name is: [%FIRST_NAME%]\n\nYour Email is: [%EMAIL%]\n\n\n';
  inputStr = `${inputPrefix}[%IF:[%FIRST_NAME%]=='Alon'%]Msg only for Alon\n\n[%END:IF%]

    [%ELSEIF:[%FIRST_NAME%]=='Itay'%]

    Msg only for Itay

                     [%END:IF%]

    [%ELSEIF:[%FIRST_NAME%]=='Nitzan'%]

    Msg only for Nitzan

                     [%END:IF%]

    [%ELSEIF:[%FIRST_NAME%]=='Dudu'%]

    Msg only for Dudu

                     [%END:IF%]

    [%ELSE%]

    Default msg for no one specific

        [%END:IF%]
`;

  const inputObjForLiteralTst = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { EMAIL: 'alon_m@optimove.com', FIRST_NAME: 'Alon' } };
  addToTestCases(inputObjForLiteralTst, `${inputPrefix}Msg only for Alon\n\n`, 'Literal test');


  inputStr = 'Hi [%FIRST_NAME%]    ======    [%IF:[%EMAIL%]==\'roman_y@optimove.com\'%]      Специальное предложение отправлено на адрес Романа        Special offer sent to Roman\'s email                  [%END:IF%]    [%ELSEIF:EMAIL==\'haimi_g@optimove.com\'%]      Oferta especial enviada al correo electrónico de Haimi              [%END:IF%]    [%ELSEIF:EMAIL==\'inna_o@optimove.com\'%]      Special offer sent to Inna\'s email              [%END:IF%]    [%ELSEIF:EMAIL==\'itay_t@optimove.com\'%]      Special offer sent to Itay\'s email              [%END:IF%]    [%ELSEIF:EMAIL==\'omer_p@optimove.com\'%]      Special offer sent to Omer\'s email                    [%END:IF%]      [%ELSEIF:EMAIL==\'valeriia_v@optimove.com\'%]      Special offer sent to Valeriia\'s email          [%END:IF%]        [%ELSE%]      Special offer sent to your email              [%END:IF%]    =======    Click here [%UNSUB%] to unsubscribe        ';
  const resStr = 'Hi [%FIRST_NAME%]    ======                                        Special offer sent to your email                  =======    Click here [%UNSUB%] to unsubscribe        ';
  const inputObjForLiteralTst2 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { EMAIL: 'literalTst2@optimove.com' } };
  addToTestCases(inputObjForLiteralTst2, resStr, 'Literal test2');

  // Existence - whitespace
  const key = 'A';
  [key, `[%${key}%]`].forEach((curKey) => {
    inputStr = `[%IF: ${curKey} %]Lorem[%END  : IF%] [%  ELSE%]Ipsum[%END:IF%]`;
    const inputObjExistenceWSTst = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { A: 'asas' } };
    addToTestCases(inputObjExistenceWSTst, 'Lorem', `Existence Tst with WS key: ${curKey} - value exists`);
    const inputObjExistenceWSTst2 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { A: '' } };
    addToTestCases(inputObjExistenceWSTst2, 'Ipsum', `Existence Tst with WS key: ${curKey} - value doesn't exist`);
  });


  inputStr = 'A[%IF:X==1%]B[%END:IF%]C[%ELSE%]D[%END:IF%]E';
  const inputObjMiddleTxtTst = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { X: 1 } };
  addToTestCases(inputObjMiddleTxtTst, 'ABCE', 'MiddleTxt 1');

  inputStr = 'A[%IF:X==1%]B[%END:IF%]C[%ELSE%]D[%END:IF%]E';
  const inputObjMiddleTxtTst2 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { x: 2 } };
  addToTestCases(inputObjMiddleTxtTst2, 'ACDE', 'MiddleTxt 2');

  inputStr = "A[%IF:X ==    'Y'     %]B[%END:IF%]C[%ELSE%]D[%END:IF%]E";
  const inputObjMiddleTxtTst3 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { X: 'Y' } };
  addToTestCases(inputObjMiddleTxtTst3, 'ABCE', 'MiddleTxt 3');

  inputStr = "A[%IF:X == 'Y' %]B[%END:IF%]C[%ELSE%]D[%END:IF%]E";
  const inputObjMiddleTxtTst4 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { X: 'Z' } };
  addToTestCases(inputObjMiddleTxtTst4, 'ACDE', 'MiddleTxt 4');


  inputStr = "[%IF:NAME == 'A M' %] X [%END:IF%]";
  const inputObjWSInVal = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { NAME: 'A M' } };
  addToTestCases(inputObjWSInVal, ' X ', 'White spaces in String literal value tst');

  inputStr = "[%IF:[%NAME%] == 'A M' %] X [%END:IF%]";
  const inputObjWSInVal2 = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { NAME: 'A M' } };
  addToTestCases(inputObjWSInVal2, ' X ', 'White spaces in String literal value tst - clause variable in brackets');

  /* - TODO make time test work
    const curTimeKey = datetimeHelper.TimeTags[0];
    inputStr = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curTimeKey}${consts.OP_GT}'08:19 AM'${consts.CUSTOM_CLOSE_DELIMITER}
      Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}'`;
    inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: { [curDateKey]: '09:00 AM' } };
    addToTestCases(inputObj, 'Lorem ipsum', `Time test ${curTimeKey}${consts.OP_GT}08:19 AM - sent 09:00 AM`);
    */
  /*
    //Languages - [%%] in input string
      // ******Need to stabilize******
    var possibleLanguageVals = ["Spanish", "englIsh", "Italian"];
    var INPUT_PAGE_LANGUAGE_BRACKETS_IN_INPUT = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}

        {consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [`${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal };
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE_BRACKETS_IN_INPUT, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal.toUpperCase() == "English".toUpperCase() ? sectionsPerValue.languageEnglishText :
            langVal.toUpperCase() != "Italian".toUpperCase() ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value ( ${consts.CUSTOM_OPEN_DELIMITER}${consts.CUSTOM_CLOSE_DELIMITER} in input str): ${langVal}`);
    });

      //Whitespace #2
       //******Need to stabilize******
      var INPUT_PAGE_WHITESPACES2 = `
          ${consts.CUSTOM_OPEN_DELIMITER}         IF\t\t${consts.LOGICAL_CONDITION_DELIMITER}  ${FAV_PROD_KEY}  ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.favProductExistenceText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
          ${consts.CUSTOM_OPEN_DELIMITER}\n\nELSEIF             ${consts.LOGICAL_CONDITION_DELIMITER}\n${LANGUAGE_KEY}   ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
          ${consts.CUSTOM_OPEN_DELIMITER}    ELSE \n\t${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.favProductNonExistenceText} ${consts.CUSTOM_OPEN_DELIMITER} END  \t ${consts.LOGICAL_CONDITION_DELIMITER}  \nIF   ${consts.CUSTOM_CLOSE_DELIMITER}`;
      var possibleFavProdVals = ["", "[%FAV_PROD%]", "FAV_PROD"];
      var possibleLanguageVals = ["", "Spanish", "English"];
      possibleLanguageVals.forEach(function (langVal){
        possibleFavProdVals.forEach(function (prodVal) {
              var prodAttrs = { [FAV_PROD_KEY]: prodVal,  [LANGUAGE_KEY]: langVal  };
              var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_WHITESPACES2, [consts.ATTRIBUTES_KEY_STR]: prodAttrs };
              var FavProdCorrectResult = (prodVal == null || prodVal.trim() === '') ? sectionsPerValue.favProductNonExistenceText :
                                         (langVal == null || langVal.trim() === '') ? sectionsPerValue.languageSpanishText : sectionsPerValue.favProductExistenceText;
              addToTestCases(inputObj, FavProdCorrectResult, `Whitespace test 2 - should return string according to fav prod: ${prodVal} lang: ${langVal}`);
        });
      });
    //favorite product
    var INPUT_PAGE_STATE = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX} ${FAV_PROD_KEY} ${consts.CUSTOM_CLOSE_DELIMITER}
                              ${sectionsPerValue.favProductExistenceText}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                              ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.favProductNonExistenceText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;


    var inputObj = { [consts.INPUT_KEY_STR]: INPUT_PAGE_STATE };
    addToTestCases(inputObj, sectionsPerValue.favProductNonExistenceText,
        `should return string - no favorite product provided`);

    var favProdAttrs = { [FAV_PROD_KEY]: "Gucci handbag" };
    inputObj[consts.ATTRIBUTES_KEY_STR] = favProdAttrs;
    addToTestCases(inputObj, sectionsPerValue.favProductExistenceText,
        `should return string with the favorite product key (${FAV_PROD_KEY})`);

    //Testing case insensitivity

    var INPUT_PAGE_CASE1 = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX} ${FAV_PROD_KEY.toLowerCase()} ${consts.CUSTOM_CLOSE_DELIMITER}
                              ${sectionsPerValue.favProductExistenceText}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var INPUT_PAGE_CASE2 = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX} ${FAV_PROD_KEY.toUpperCase()} ${consts.CUSTOM_CLOSE_DELIMITER}
                              ${sectionsPerValue.favProductExistenceText}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var INPUT_PAGE_CASE3 = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX} ${FAV_PROD_KEY.charAt(0).toLowerCase()}${FAV_PROD_KEY.slice(1)} ${consts.CUSTOM_CLOSE_DELIMITER}
                              ${sectionsPerValue.favProductExistenceText}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var INPUT_PAGE_CASE4 = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX} ${FAV_PROD_KEY.charAt(0).toUpperCase()}${FAV_PROD_KEY.slice(1)} ${consts.CUSTOM_CLOSE_DELIMITER}
                              ${sectionsPerValue.favProductExistenceText}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

    var inputPagesForCase = [INPUT_PAGE_CASE1, INPUT_PAGE_CASE2, INPUT_PAGE_CASE3, INPUT_PAGE_CASE4];

    var favProdAttrsForCase1 = { [FAV_PROD_KEY.toLowerCase()]: "Gucci handbag" };
    var favProdAttrsForCase2 = { [FAV_PROD_KEY.toUpperCase()]: "Gucci handbag" };
    var favProdAttrsForCase3 = { [`${FAV_PROD_KEY.charAt(0).toLowerCase()}${FAV_PROD_KEY.slice(1)}`]: "Gucci handbag" };
    var favProdAttrsForCase4 = { [`${FAV_PROD_KEY.charAt(0).toUpperCase()}${FAV_PROD_KEY.slice(1)}`]: "Gucci handbag" };

    var favProdsForCase = [favProdAttrsForCase1, favProdAttrsForCase2, favProdAttrsForCase3, favProdAttrsForCase4];
    inputPagesForCase.forEach(function (inputPage) {
        favProdsForCase.forEach(function (favProd) {
            var inputObjForCase = {
                [consts.INPUT_KEY_STR]: inputPage,
                [consts.ATTRIBUTES_KEY_STR]: favProd
            };

            addToTestCases(inputObjForCase, `${sectionsPerValue.favProductExistenceText}`,
                `Checking case (sent: ${inputPage} ${favProd}).\nShould return: ${sectionsPerValue.favProductExistenceText}`);
        });
    });

    //Testing special chars in var name
    //'_' \ '{' '}'
    var varName = `${FAV_PROD_KEY}_{2}`;
    var existsTxt = "Exists!";
    var nonExistentTxt = "Doesn't Exist!";
    var INPUT_PAGE_SPECIAL_CHARS1 = `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${varName}${consts.CUSTOM_CLOSE_DELIMITER}
                              ${existsTxt}
                              ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                              ${consts.CUSTOM_ELSE_BLOCK_TAG} ${nonExistentTxt} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var specialCharsInputObj = {
        [consts.INPUT_KEY_STR]: INPUT_PAGE_SPECIAL_CHARS1,
        [consts.ATTRIBUTES_KEY_STR]: { "placeHolder": "Lorem ipsum" }
    };

    //addToTestCases(specialCharsInputObj, nonExistentTxt,
    //    `Checking special chars (sent: ${INPUT_PAGE_SPECIAL_CHARS1}).\nShould return: ${nonExistentTxt}`);

    var specialCharsInputObj2 = {
        [consts.INPUT_KEY_STR]: INPUT_PAGE_SPECIAL_CHARS1,
        [consts.ATTRIBUTES_KEY_STR]: { [varName]: "Lorem ipsum" }
    };

    //addToTestCases(specialCharsInputObj, nonExistentTxt,
    //    `Checking special chars (sent: ${INPUT_PAGE_SPECIAL_CHARS1} ${varName}).\nShould return: ${nonExistentTxt}`);

    //Testing '[%' '%]' in var name
    */

  generalTests(testCases);
});
