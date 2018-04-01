'use strict';

var expect = require('chai').expect;
var translator = require('../index');
const consts = require('../lib/consts.js');

describe('GeneralTranslator', function() {
    it('should return empty string', function() {
        var result = translator.translate("");
        expect(result[consts.OUTPUT_KEY_STR]).to.equal('');
    });
});