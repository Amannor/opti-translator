'use strict';

var expect = require('chai').expect;
const decode = require('unescape');
var _ = require('lodash');
var translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');
const tagPrefixes = require('../lib/tagPrefixes.js');
var ValidationResult = require("../lib/validationResult.js");

describe('General Validation Tests', function () {

    function areValidationResultsEqual(lhs, rhs) {
        if (rhs == null) {
            return lhs == null;
        }
        else if (lhs == null) {
            return false;
        }
        else {
            return lhs.isValidationEqual(rhs);
        }
    }

    var tstObjs = [];

    function executeGeneralValidationTests() {
        tstObjs.forEach(function (testObj) {
            var tstMsg = testObj[tstConsts.TST_MSG_KEY];
            var testInputStr = testObj[tstConsts.INPUT_KEY];
            var expectedValidationResults = testObj[consts.VALIDATE_OUTPUT_KEY_STR];
            var maxClausesPerBlock = testObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK];
            var maxBlocksPerTemplate = testObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE];

            it(tstMsg, function () {
                var result = translator.translate(testInputStr, null, true, maxClausesPerBlock, maxBlocksPerTemplate);
                var actualValidationResults = result[consts.VALIDATE_OUTPUT_KEY_STR];
                expect(_.differenceWith(expectedValidationResults, actualValidationResults, areValidationResultsEqual).length).to.equal(0);
                expect(_.differenceWith(actualValidationResults, expectedValidationResults, areValidationResultsEqual).length).to.equal(0);
            });
        });
    }

    function addToValidationTests(msgToAdd, inputToAdd, resultsToAdd, maxClausesPerBlock = null, maxBlocksPerTemplate = null) {
        var tstObj = {};
        tstObj[tstConsts.TST_MSG_KEY] = msgToAdd;
        tstObj[tstConsts.INPUT_KEY] = inputToAdd;
        tstObj[consts.VALIDATE_OUTPUT_KEY_STR] = resultsToAdd;
        tstObj[consts.VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK] = maxClausesPerBlock;
        tstObj[consts.VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE] = maxBlocksPerTemplate;

        tstObjs.push(tstObj);
    }

    addToValidationTests('should return empty validation list', "", []);
    /*    function validInputTests(inputStr) {
            it('should return empty validation list', function () {
                var result = translator.translate(inputStr);
                expect(result[consts.VALIDATE_OUTPUT_KEY_STR].length).to.equal(0);
                result = translator.translate("", null, false);
                expect(result[consts.VALIDATE_OUTPUT_KEY_STR].length).to.equal(0);
    //        result = translator.translate("", null, true);
                //      expect(result[consts.VALIDATE_OUTPUT_KEY_STR].length).to.equal(0);


            });
        }*/

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

    // A single [%END:IF%} missing
    var inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text}`;
    var res = new ValidationResult(consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER}`, `${consts.VALIDATION_BLOCK_MSG} - missing required closing clause ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`);
    addToValidationTests(`Should return a ${res.errorMsg} - missing ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`, inputStr, [res]);


    // More blocks than allowed
    var inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

    inputStr = `${inputStr} ${inputStr} ${inputStr}`;
    var maxAllowedCondBlocksNum = 2;
    var validationMsg = `${consts.VALIDATION_BLOCK_MSG}: block #${maxAllowedCondBlocksNum + 1} exceeds max number of allowed blocks: ${maxAllowedCondBlocksNum}`;
    var res = new ValidationResult(maxAllowedCondBlocksNum, consts.VALIDATION_START_INDEX,
        `${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER}`, validationMsg);
    addToValidationTests(`Should return: ${res.errorMsg}`, inputStr, [res], 999, maxAllowedCondBlocksNum);


    // Compound valid tag prefixes
    tagPrefixes.PersonalizationTypesPrefixes.forEach(function (prefix) {

        var curKeys = [`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A`,
            `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B`,
            `${prefix}${consts.LOGICAL_CONDITION_DELIMITER}A${consts.LOGICAL_CONDITION_DELIMITER}B${consts.LOGICAL_CONDITION_DELIMITER}C`
        ];
        curKeys.forEach(function (curKey) {
            var inputStr = `                                                                                                                                                        
                   ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${curKey}>200${consts.CUSTOM_CLOSE_DELIMITER} body ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
            addToValidationTests(`Valid prefixes checked: ${curKey}`, inputStr, []);
        });
    });

    //Operators testing (both legal & illegal)
    const G = require('generatorics');
//    var atomicChars = ['=', '!', ';', '<', '>', '^', '/', '\\', '?', '+', '-', '_', '~', '.', ',', '|', '&', '*', '(', ')', '[', ']', '{', '}', '#', '@', '|', '%', '@'];
    var atomicCharsSet = new Set();
    consts.LEGAL_OPERATORS.forEach(function (op) {
        op.split("").forEach(function (opChar) {
            atomicCharsSet.add(opChar);
        });
    });
    var atomicChars = Array.from(atomicCharsSet);
    var maxOperatorLen = 4;

    for (var operatorLen = 1; operatorLen <= maxOperatorLen; operatorLen++) {
        for (var permutation of G.baseN(atomicChars, operatorLen)) {
            var operator = permutation.join("");
            if (operator.split("!").join("") == "") {
                continue;
            }
            var inputStr = `
               ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}ATTR${operator}200${consts.CUSTOM_CLOSE_DELIMITER} Lorem ipsum ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;

            if (consts.LEGAL_OPERATORS.indexOf(operator) >= 0) {
                addToValidationTests(`Legal operator: ${operator}`, inputStr, []);
            } /*else {
                var legalOpsInOperator = consts.LEGAL_OPERATORS.filter(function (legalOp) {
                    var operatorIndex = operator.indexOf(legalOp);
                    return operatorIndex > 0;
                });
                var res = new ValidationResult(consts.VALIDATION_START_INDEX, consts.VALIDATION_START_INDEX,
                    inputStr.substring(0, inputStr.indexOf(consts.CUSTOM_CLOSE_DELIMITER) + consts.CUSTOM_CLOSE_DELIMITER.length), consts.VALIDATION_ILLEGAL_OP_MSG);

                addToValidationTests(`Illegal operator: ${operator}`, inputStr, [res]);
            }*/
        }
    }

    /*Todo:
        1) Generate all permutations of atomicChars (including repeat of char) up to length 4
        2) Iterate over the list from the previous paragraph, excluding consts.LEGAL_OPERATORS, and test the validationResults returned
            *Consider using the following npm packages: generatorics, ombination-generator, js-combinatorics
            * Search 'keywords:permutations' in the npmjs.com website
    */


    executeGeneralValidationTests();
});
