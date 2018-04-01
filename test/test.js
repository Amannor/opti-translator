'use strict';

var expect = require('chai').expect;
var translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');

describe('General Translator Tests', function() {
    it('should return empty string', function() {
        var result = translator.translate("");
        expect(result[consts.OUTPUT_KEY_STR]).to.equal('');
    });

    function generalTests(testObjs) {
        testObjs.forEach(function(testObj) {
            var tstMsg = testObj[tstConsts.TST_MSG_KEY];
            it(tstMsg, function()
            {
                var testData = testObj[tstConsts.INPUT_KEY];
                var result = translator.translate(testData[tstConsts.INPUT_KEY], testData[consts.ATTRIBUTES_KEY_STR]);
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
    }

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

    //languages
    var INPUT_PAGE_LANGUAGE = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${LANGUAGE_KEY}=='English'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageEnglishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX}${LANGUAGE_KEY}!='Italian'${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.languageSpanishText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}
        ${consts.CUSTOM_ELSE_BLOCK_TAG} ${sectionsPerValue.languageItalianText} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    var possibleLanguageVals = ["Spanish", "English", "Italian"];

    possibleLanguageVals.forEach(function (langVal) {
        var langsAttrs = { [LANGUAGE_KEY]: langVal };
        var inputObj = { [tstConsts.INPUT_KEY]: INPUT_PAGE_LANGUAGE, [consts.ATTRIBUTES_KEY_STR]: langsAttrs };
        var LangsCorrectResult = langVal == "English" ? sectionsPerValue.languageEnglishText :
            langVal != "Italian" ? sectionsPerValue.languageSpanishText :
                sectionsPerValue.languageItalianText;
        addToTestCases(inputObj, LangsCorrectResult, `should return string according to language value: ${langVal}`);
    });


    /*
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