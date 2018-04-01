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

    generalTests(testCases);
});