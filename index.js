(function (translator) {
  const ejsTranslator = require('./lib/ejsTranslator');

  function preprocessInputStr(inputStr) {
    const ifRegex = String.raw`\[%\s*IF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
    const elseifRegex = String.raw`\[%\s*ELSEIF\s*:\s*\S+\s*\S+\s*\S+\s*%\]`;
    const elseRegex = String.raw`\[%\s*ELSE\s*%\]`;
    const endifRegex = String.raw`\[%\s*END\s*:\s*IF\s*%\]`;
    const condRegexes = [ifRegex, elseifRegex, elseRegex, endifRegex];
    const preprocessedInput = inputStr.replace(RegExp(condRegexes.join('|'), 'g'), x => x.replace(/\s/g, ''));
    return preprocessedInput;
  }

  function preprocessAttrs(inputAttrs) {
    const preprocessedAttrs = {};
    if (inputAttrs != null) {
      Object.keys(inputAttrs).forEach(key => (inputAttrs[key] == null || inputAttrs[key].trim() == '') && delete inputAttrs[key]);
      // Object.keys(inputAttrs).forEach(function(key) {if(!(inputAttrs[key] == null || inputAttrs[key].trim() == '')) preprocessedAttrs[key] = inputAttrs[key];});
    }
    return preprocessedAttrs;
  }

  translator.translate = function (dataToTranslate, attrsObj = null, shouldValidate = false, maxClausesPerBlock = null, maxCondBlocks = null, shouldReturnGroupByMapping = false) {
    const cleanedInputData = preprocessInputStr(dataToTranslate);
    // var cleanedAttrs = preprocessAttrs(attrsObj);
    return ejsTranslator.translateToEjs(cleanedInputData, attrsObj, shouldReturnGroupByMapping, shouldValidate, maxClausesPerBlock, maxCondBlocks);
  };
}(module.exports));
