(function (translator) {
    var ejsTranslator = require('./lib/ejsTranslator');

    translator.translate = function (dataToTranslate, attrsObj = null, shouldReturnGroupByMapping = false) {
        return ejsTranslator.translateToEjs(dataToTranslate, attrsObj, shouldReturnGroupByMapping);
    };

})(module.exports);