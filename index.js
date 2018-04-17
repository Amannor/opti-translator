(function (translator) {
    var ejsTranslator = require('./lib/ejsTranslator');

    function preprocessInputStr(inputStr)
    {
        var ifRegex = String.raw`\[%\s*IF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
        var elseifRegex = String.raw`\[%\s*ELSEIF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
        var elseRegex = String.raw`\[%\s*ELSE\s*%\]`;
        var endifRegex = String.raw`\[%\s*END\s*:\s*IF\s*%\]`;
        var condRegexes = [ifRegex, elseifRegex, elseRegex, endifRegex];
        var preprocessedInput = inputStr.replace(RegExp(condRegexes.join("|"), 'g'), function(x) { return x.replace(/\s/g,'');});
        return preprocessedInput;
    }

    function preprocessAttrs(inputAttrs)
    {
        var preprocessedAttrs = {};
        if(inputAttrs != null) {
            Object.keys(inputAttrs).forEach((key) => (inputAttrs[key] == null || inputAttrs[key].trim() == '') && delete inputAttrs[key]);
            //Object.keys(inputAttrs).forEach(function(key) {if(!(inputAttrs[key] == null || inputAttrs[key].trim() == '')) preprocessedAttrs[key] = inputAttrs[key];});
        }
        return preprocessedAttrs;
    }

    translator.translate = function (dataToTranslate, attrsObj = null, shouldValidate = false, maxClausesPerBlock=null, maxCondBlocks=null, shouldReturnGroupByMapping = false) {
        var cleanedInputData = preprocessInputStr(dataToTranslate);
        //var cleanedAttrs = preprocessAttrs(attrsObj);
        return ejsTranslator.translateToEjs(cleanedInputData, attrsObj, shouldReturnGroupByMapping, shouldValidate, maxClausesPerBlock, maxCondBlocks);
    };
})(module.exports);