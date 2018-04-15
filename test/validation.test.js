'use strict';

//import ValidationResult from "../lib/validationResult";
var expect = require('chai').expect;
const decode = require('unescape');
var _ = require('lodash');
var translator = require('../index');
const consts = require('../lib/consts.js');
const tstConsts = require('./testConsts.js');
var ValidationResult = require("../lib/validationResult.js");

describe('General Validation Tests', function() {

    function areValidationResultsEqual(lhs, rhs)
    {
        if(rhs == null)
        {
            if(lhs == null){return true;}
            else{return lhs.isValidationEqual(rhs);}
        }
        else if(lhs == null){return rhs.isValidationEqual(lhs);}
        else {return lhs.isValidationEqual(rhs);}
    }

    var tstObjs = [];
    function executeGeneralValidationTests() {
        tstObjs.forEach(function(testObj) {
            var tstMsg = testObj[tstConsts.TST_MSG_KEY];
            var testInputStr = testObj[tstConsts.INPUT_KEY];
            var expectedValidationResults =  testObj[consts.VALIDATE_OUTPUT_KEY_STR];
            it(tstMsg, function()
            {
                var result = translator.translate(testInputStr, null, true);
                var actualValidationResults = result[consts.VALIDATE_OUTPUT_KEY_STR];
                expect(_.differenceWith(expectedValidationResults, actualValidationResults, areValidationResultsEqual).length).to.equal(0);
            });
        });
    }

     function addToValidationTests(msgToAdd, inputToAdd, resultsToAdd)
     {
         var tstObj = {};
         tstObj[tstConsts.TST_MSG_KEY] = msgToAdd;
         tstObj[tstConsts.INPUT_KEY] = inputToAdd;
         tstObj[consts.VALIDATE_OUTPUT_KEY_STR] = resultsToAdd;
         tstObjs.push(tstObj);
     }

    addToValidationTests('should return empty validation list', "", []);
    executeGeneralValidationTests();
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
   /*
    var ORDER_KEY = "ORDER_VAL";
    var inputStr = `
        ${consts.CUSTOM_OPENING_IF_BLOCK_PREFIX}${ORDER_KEY}>200${consts.CUSTOM_CLOSE_DELIMITER} ${sectionsPerValue.orderGT200Text} ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
    it('should return empty validation list', function() {
       var result = translator.translate("");
          expect(result[consts.VALIDATE_OUTPUT_KEY_STR].length).to.equal(0);
    });
    */
});
