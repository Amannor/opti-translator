(function (translator) {
    var ejsTranslator = require('./lib/ejsTranslator');

    translator.translate = function (dataToTranslate, attrsObj = null, shouldReturnGroupByMapping = false, shouldValidate = false) {
        return ejsTranslator.translateToEjs(dataToTranslate, attrsObj, shouldReturnGroupByMapping, shouldValidate );
    };
})(module.exports);