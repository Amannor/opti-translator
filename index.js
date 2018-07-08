/* eslint-disable no-param-reassign */
const ejsTranslator = require('./lib/ejsTranslator');
const consts = require('./lib/consts.js');

(function (translator) {
  function getClauseEndIndex(strToCheck) {
    let openingClauseEndIndex = -1;
    let numOfOpenBracketsSeen = 0;
    for (let i = 0; i < strToCheck.length && openingClauseEndIndex < 0; i += 1) {
      if (strToCheck.substring(i).startsWith(consts.CUSTOM_OPEN_DELIMITER)) {
        numOfOpenBracketsSeen += 1;
      } else if (strToCheck.substring(i).startsWith(consts.CUSTOM_CLOSE_DELIMITER)) {
        numOfOpenBracketsSeen -= 1;
        if (numOfOpenBracketsSeen === 0) {
          openingClauseEndIndex = i + consts.CUSTOM_CLOSE_DELIMITER.length;
        }
      }
    }
    return openingClauseEndIndex;
  }


  function preprocessInputStr(inputStr) {
    const elseRegex = String.raw`\[%\s*ELSE\s*%\]`;
    const endifRegex = String.raw`\[%\s*END\s*:\s*IF\s*%\]`;
    let condRegex = RegExp([elseRegex, endifRegex].join('|'), 'g');
    inputStr = inputStr.replace(condRegex, x => x.replace(/\s/g, ''));
    let preprocessedInput = '';


    const ifOpenRegex = String.raw`\[%\s*IF\s*:`;
    const elseifOpenRegex = String.raw`\[%\s*ELSEIF\s*:`;
    condRegex = RegExp([ifOpenRegex, elseifOpenRegex].join('|'), 'g');
    let clauseStartIndex = -1;

    while (inputStr && ((clauseStartIndex = inputStr.search(condRegex)) >= 0)) {
      preprocessedInput += inputStr.substring(0, clauseStartIndex);
      const clauseEndIndex = getClauseEndIndex(inputStr.substring(clauseStartIndex)) + clauseStartIndex;

      let clause = '';
      if (clauseEndIndex >= 0) {
        clause = inputStr.substring(clauseStartIndex, clauseEndIndex);
        const clauseParts = clause.split("'");
        if (clauseParts.length === 3) {
          preprocessedInput += [clauseParts[0].replace(/\s/g, ''), clauseParts[1], clauseParts[2].replace(/\s/g, '')].join("'");
        } else {
          preprocessedInput += clause.replace(/\s/g, '');
        }
      }
      const inputStrNextIndex = (clauseEndIndex < 0 || clauseEndIndex === inputStr.length - 1) ? inputStr.length - 1 : clauseEndIndex;
      inputStr = inputStr.substring(inputStrNextIndex);
    }
    preprocessedInput += inputStr;

    return preprocessedInput;
  }

  translator.translate = function (dataToTranslate, attrsObj = null, shouldValidate = false, maxClausesPerBlock = null, maxCondBlocks = null, shouldReturnGroupByMapping = false) {
    const cleanedInputData = preprocessInputStr(dataToTranslate);
    const attrsLocalCopy = attrsObj === null ? attrsObj : Object.assign({}, attrsObj);
    return ejsTranslator.translateToEjs(cleanedInputData, attrsLocalCopy, shouldReturnGroupByMapping, shouldValidate, maxClausesPerBlock, maxCondBlocks);
  };
}(module.exports));
