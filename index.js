(function (translator) {
    var ejsTranslator = require('./lib/ejsTranslator');

    translator.translate = function (dataToTranslate, attrsObj = null, shouldValidate = false, shouldReturnGroupByMapping = false) {
        return ejsTranslator.translateToEjs(dataToTranslate, attrsObj, shouldReturnGroupByMapping, shouldValidate );
    };
})(module.exports);