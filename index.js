(function (translator) {
    var ejsTranslator = require('./lib/ejsTranslator');

    function preprocessInput(inputStr)
    {
        var ifRegex = String.raw`\[%\s*IF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
        var elseifRegex = String.raw`\[%\s*ELSEIF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
        var elseRegex = String.raw`\[%\s*ELSE\s*%\]`;
        var endifRegex = String.raw`\[%\s*END\s*:\s*IF\s*%\]`;
        var condRegexes = [ifRegex, elseifRegex, elseRegex, endifRegex];
        var preprocessedInput = inputStr.replace(RegExp(condRegexes.join("|"), 'g'), function(x) { return x.replace(/\s/g,'');});
        return preprocessedInput;
    }
    translator.translate = function (dataToTranslate, attrsObj = null, shouldValidate = false, shouldReturnGroupByMapping = false) {
        var cleanedInputData = preprocessInput(dataToTranslate);
        return ejsTranslator.translateToEjs(cleanedInputData, attrsObj, shouldReturnGroupByMapping, shouldValidate );
    };
})(module.exports);