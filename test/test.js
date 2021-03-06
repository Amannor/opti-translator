'use strict';

var expect = require('chai').expect;
var translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');
const tagPrefixes = require('../lib/tagPrefixes.js');

describe('General Translator Tests', function() {
    it('should return empty string', function() {
        var result = translator.translate("");
        expect(result[consts.OUTPUT_KEY_STR]).to.equal('');
    });

    function generalTests(testObjs) {
        testObjs.forEach(function(testObj) {
            var tstMsg = testObj[tstConsts.TST_MSG_KEY];
            var testData = testObj[tstConsts.INPUT_KEY];
            var attrs =  testData[consts.ATTRIBUTES_KEY_STR];
            it(tstMsg, function()
            {
                var result = translator.translate(testData[tstConsts.INPUT_KEY], attrs);
                expect(result[consts.OUTPUT_KEY_STR].trim()).to.equal(testObj[tstConsts.CORRECT_RESULT_KEY].trim());

            });
            it(`${tstMsg} - brackets transformation in attrs keys`, function()
            {
                var transformedAttrs =  {};
                Object.keys(attrs).forEach(function(attrKey)
                {
                    var newKey = (attrKey.startsWith(consts.CUSTOM_OPEN_DELIMITER) && attrKey.endsWith(consts.CUSTOM_CLOSE_DELIMITER)) ?
                        attrKey.replace(consts.CUSTOM_OPEN_DELIMITER, "").replace(consts.CUSTOM_CLOSE_DELIMITER, "") :
                        `${consts.CUSTOM_OPEN_DELIMITER}${attrKey}${consts.CUSTOM_CLOSE_DELIMITER}`;
                   transformedAttrs[newKey] = attrs[attrKey];
                });
                var result = translator.translate(testData[tstConsts.INPUT_KEY], transformedAttrs);
                expect(result[consts.OUTPUT_KEY_STR].trim()).to.equal(testObj[tstConsts.CORRECT_RESULT_KEY].trim());
            });
        });
    }

    var testCases = [];
    function addToTestCases(inputObjToAdd, correctResultToAdd, tstMsgToAdd) {
        var tstObj = {};
        tstObj[tstConsts.INPUT_KEY] = inputObjToAdd;
        tstObj[tstConsts.CORRECT_RESULT_KEY] = correctResultToAdd;
        tstObj[tstConsts.TST_MSG_KEY] = tstMsgToAdd;
        testCases.push(tstObj);
    }

    const ORDER_KEY = "ORDER_VALUE";
    const LANGUAGE_KEY = "LANGUAGE";
    const FAV_PROD_KEY = "FAVORITE_PRODUCT";
    const sectionsPerValue = {
        orderGT200Text: "Order greater than 200",
        orderLTOE200Text: "Order less than or equal to 200",
        orderGT100LT200Text: "Order greater than 100 and less than 200",
        orderLT100Text: "Order less than 100",
        orderNNText: "Order non-negative",
        orderNText: "Order negative",
        languageEnglishText: "Content for English",
        languageNotEnglishText: "Content not for English",
        languageSpanishText: "Content for Spanish",
        languageNotSpanishText: "Content not for Spanish",
        languageItalianText: "Content for Italian",
        favProductExistenceText: `Your favorite product: ${consts.CUSTOM_OPEN_DELIMITER}${FAV_PROD_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`,
        favProductNonExistenceText: `No favorite product`
    };

    //orders
    var inputPageOrders = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${ORDER_KEY}>100${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT100LT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.orderLT100Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var possibleOrderVals = [-5, 0, 50, 100, 150, 200, 250];

    possibleOrderVals.forEach(function (orderVal) {
        var OrderValAttrs = { [ORDER_KEY]: orderVal };
        var inputObj = { [tstConsts.INPUT_KEY]: inputPageOrders, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
        var OrdersCorrectResult = orderVal > 200 ? sectionsPerValue.orderGT200Text :
            orderVal > 100 ? sectionsPerValue.orderGT100LT200Text :
                sectionsPerValue.orderLT100Text;
        addToTestCases(inputObj, OrdersCorrectResult, `should return string according to order value: ${orderVal}`);
    });
    //orders - not all if blocks have respective ifelse \ else blocks
    var inputPageOrdersNoElse1 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}<=200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderLTOE200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

    possibleOrderVals.forEach(function (orderVal) {
        var OrderValAttrs = { [ORDER_KEY]: orderVal };
        var inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse1, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
        var OrdersCorrectResult = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text :"";
        addToTestCases(inputObj, OrdersCorrectResult, `should return string (no else test#1) according to order value: ${orderVal}`);
    });

    var inputPageOrdersNoElse2 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}<=200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderLTOE200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
         ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${ORDER_KEY}>100${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT100LT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    possibleOrderVals.forEach(function (orderVal) {
        var OrderValAttrs = { [ORDER_KEY]: orderVal };
        var inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse2, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
        var OrdersCorrectResult = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text :
            orderVal > 100 ? sectionsPerValue.orderGT100LT200Text :"";
        addToTestCases(inputObj, OrdersCorrectResult, `should return string (no else test#2) according to order value: ${orderVal}`);
    });

    var inputPageOrdersNoElse3 =
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>=0${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderNNText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
         ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.orderNText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    possibleOrderVals.forEach(function (orderVal) {
        var OrderValAttrs = { [ORDER_KEY]: orderVal };
        var inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse3, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
        var OrdersCorrectResult = orderVal >= 0 ? sectionsPerValue.orderNNText :
            sectionsPerValue.orderNText;
        addToTestCases(inputObj, OrdersCorrectResult, `should return string (non\negative) according to order value: ${orderVal}`);
    });

    var inputPageOrdersNoElse4 =
        `${inputPageOrdersNoElse1} ${inputPageOrdersNoElse3}`;
    possibleOrderVals.forEach(function (orderVal) {
        var OrderValAttrs = { [ORDER_KEY]: orderVal };
        var inputObj = { [tstConsts.INPUT_KEY]: inputPageOrdersNoElse4, [consts.ATTRIBUTES_KEY_STR]: OrderValAttrs };
        var OrdersCorrectResult1 = orderVal <= 200 ? sectionsPerValue.orderLTOE200Text : "";
        var OrdersCorrectResult2 = orderVal >= 0 ? sectionsPerValue.orderNNText :
            sectionsPerValue.orderNText;
        addToTestCases(inputObj, `${OrdersCorrectResult1}  ${OrdersCorrectResult2}`, `should return string  (compound no else)  according to order value: ${orderVal}`);
    });

    //Whitespace #1
    var INPUT_PAGE_WHITESPACES = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}       ${LANGUAGE_KEY}\n==     'English'   ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}\n${LANGUAGE_KEY}\t\t\t!=\n\n  'Italian'   ${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPEN_DELIMITER}    ELSE \n\t${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_OPEN_DELIMITER} END  \t ${consts.LOGICAL_CONDITION_DELIMITER}  \nIF   ${consts.CUSTOM_CLOSE_DELIMITER}`;
    var possibleLanguageVals = ["Italian", "Spanish", "English"];
    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [LANGUAGE_KEY]: langVal };
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_WHITESPACES, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal == "English" ? sectionsPerValue.languageEnglishText :
            langVal != "Italian" ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `Whitespace test - should return string according to language value: ${langVal}`);
    });

    //Languages
    var INPUT_PAGE_LANGUAGE = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${LANGUAGE_KEY}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var possibleLanguageVals = ["Spanish", "englIsh", "Italian"];

    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [LANGUAGE_KEY]: langVal };
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal.toUpperCase() == "English".toUpperCase() ? sectionsPerValue.languageEnglishText :
            langVal.toUpperCase() != "Italian".toUpperCase() ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value: ${langVal}`);
    });

    //Languages - [%%] in attrs key
    var possibleLanguageVals = ["Spanish", "englIsh", "Italian"];
    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [`${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal };
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal.toUpperCase() == "English".toUpperCase() ? sectionsPerValue.languageEnglishText :
            langVal.toUpperCase() != "Italian".toUpperCase() ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value ( ${consts.CUSTOM_OPEN_DELIMITER}${consts.CUSTOM_CLOSE_DELIMITER} in key): ${langVal}`);
    });


    //Languages - duplicate attrs key - (with & without [%%])
    var INPUT_PAGE_LANGUAGE = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${LANGUAGE_KEY}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var possibleLanguageVals = ["Spanish", "englIsh", "Italian"];
    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [`${consts.CUSTOM_OPEN_DELIMITER}${LANGUAGE_KEY}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal,
                           [`${LANGUAGE_KEY}`]: langVal};
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal.toUpperCase() == "English".toUpperCase() ? sectionsPerValue.languageEnglishText :
            langVal.toUpperCase() != "Italian".toUpperCase() ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value: ${langVal} (duplicate attrs key - with & without ${consts.CUSTOM_OPEN_DELIMITER} ${consts.CUSTOM_CLOSE_DELIMITER})`);
    });

    //Languages - tag prefixes
    var possibleLanguageVals = ["Spanish", "englIsh", "Italian"];
    var possiblePrefixes = tagPrefixes.GetAllPrefixes();
    possiblePrefixes.forEach(function(tagPrefix) {
        var prefixedLangKey = `${tagPrefix}${consts.LOGICAL_CONDITION_DELIMITER}${LANGUAGE_KEY}`;
        var prefixedInputPageLang = `
                ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${prefixedLangKey}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${prefixedLangKey}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
                ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

        possibleLanguageVals.forEach(function (langVal) {
            var langsAttrs = {[`${consts.CUSTOM_OPEN_DELIMITER}${prefixedLangKey}${consts.CUSTOM_CLOSE_DELIMITER}`]: langVal};
            var inputObj = {[tstConsts.INPUT_KEY]: prefixedInputPageLang, [consts.ATTRIBUTES_KEY_STR]: langsAttrs};
            var LangsCorrectResult = langVal.toUpperCase() == "English".toUpperCase() ? sectionsPerValue.languageEnglishText :
                langVal.toUpperCase() != "Italian".toUpperCase() ? sectionsPerValue.languageSpanishText :
                    sectionsPerValue.languageItalianText;
            addToTestCases(inputObj, LangsCorrectResult, `Tag prefixes test. Prefix: ${tagPrefix} langVal: ${langVal}`);
        });
    });

    // Compound valid tag prefixes
    tagPrefixes.PersonalizationTypesPrefixes.forEach(function(prefix){

        var curKeys = [`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A`,
            `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B`,
            `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B${consts.LOGICAL_CONDITION_DELIMITER}C`
        ];
        curKeys.forEach(function(curKey){
            var inputStr = `                                                                                                                                                        
                   ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curKey}>200${consts.CUSTOM_CLOSE_DELIMITER} body ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
            var inputObj = { [tstConsts.INPUT_KEY]: inputStr, [consts.ATTRIBUTES_KEY_STR]: {"placeholderKey": "placeholderVal"} };
            addToTestCases(inputObj, "", `should return empty result, checking that valid prefix (${curKey}) doesn't throw`);
        });
    });

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