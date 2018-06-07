/* eslint-disable no-fallthrough,max-len */
const ejs = require('ejs');
const ejsLint = require('ejs-lint');
const _ = require('lodash');
const moment = require('moment');
const consts = require('./consts.js');
const ValidationResult = require('./validationResult');
const CondFormatter = require('./formatter');

(function (ejsTranslator) {
  let formatter;
  let shouldReturnValidations = true;
  let curCondBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
  let curInnerBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
  let maxAllowedConditionalBlocks = null;
  let maxAllowedClausesPerBlock = null;
  let validationResults = [];


  function addValidationResult(condition, errMsg = '', details = '', condBlockId = curCondBlockId, innerBlockId = curInnerBlockId) {
    let res;
    if (shouldReturnValidations) {
      res = new ValidationResult(condBlockId, innerBlockId, condition, errMsg, details);
      validationResults.push(res);
    }
  }

  function updateCondBlocksCounters(condClause) {
    if (condClause.startsWith(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX)) {
      curCondBlockId += 1;
      curInnerBlockId = consts.VALIDATION_START_INDEX;
      if (maxAllowedConditionalBlocks && typeof maxAllowedConditionalBlocks === 'number' && maxAllowedConditionalBlocks > 0 && maxAllowedConditionalBlocks < curCondBlockId + 1) {
        addValidationResult(condClause, `${consts.VALIDATION_BLOCK_MSG}: block #${curCondBlockId + 1} exceeds max number of allowed blocks: ${maxAllowedConditionalBlocks}`);
      }
    } else if (condClause.startsWith(`${consts.CUSTOM_OPEN_DELIMITER}ELSE`)) {
      curInnerBlockId += 1;
      if (curCondBlockId === consts.VALIDATION_UNASSIGNED_INDEX) {
        addValidationResult(condClause, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG);
      }
      if (maxAllowedClausesPerBlock && typeof maxAllowedClausesPerBlock === 'number' && maxAllowedClausesPerBlock > 0 && maxAllowedClausesPerBlock < curInnerBlockId + 1) {
        addValidationResult(condClause, `${consts.VALIDATION_BLOCK_MSG}: condition #${curInnerBlockId + 1} exceeds max number of allowed conditions per block: ${maxAllowedClausesPerBlock}`);
      }
    }
  }

  function init(attrsObj) {
    curCondBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
    curInnerBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
    formatter = new CondFormatter(addValidationResult, attrsObj);
    validationResults = [];
  }


  ejsTranslator.translateToEjs = function (dataToTranslate, attrsObj, shouldReturnGroupByMapping, shouldValidate, maxClausesPerBlock, maxCondBlocks) {
    init(attrsObj);
    shouldReturnValidations = shouldValidate;
    maxAllowedClausesPerBlock = maxClausesPerBlock;
    maxAllowedConditionalBlocks = maxCondBlocks;
    let ClausesSet = new Set();
    const GroupByVars = {};

    /*
                        groupByVars format:
                        {"AVG_ORDER_VAL" :
                                {"<=" : [100, 300, 500] , "==" : [10,150]}
                         "LANGUAGE" :
                                {"!=" : [English, Spanish] , "E" : []}
                        }
                    */
    function prepareGroupByVarsForSending() {
      Object.keys(GroupByVars).forEach((variable) => {
        // e.g. variable: "AVG_ORDER_VAL"
        Object.keys(GroupByVars[variable]).forEach((operator) => {
          // e.g. operator: "<="
          const valsSet = GroupByVars[variable][operator];
          // changing set to array (for serialization) and sorting while we're at it
          GroupByVars[variable][operator] = [...(valsSet)].sort();
        });
      });
    }

    function registerClause(clauseStr) {
      if (!clauseStr) {
        return;
      }
      ClausesSet.add(clauseStr);
      if (shouldReturnGroupByMapping) {
        let operatorsInClause = consts.LEGAL_OPERATORS.filter((operator) => {
          const operatorIndex = clauseStr.indexOf(operator);
          return operatorIndex > 0;
        });
        switch (operatorsInClause.length) {
          case 0:
            // updateGroupByVars(clauseStr);
            break;
          case 2: {
            // todo - write this prettier
            const correctList1 = ['<', '<='].sort();
            const correctList2 = ['>', '>='].sort();
            operatorsInClause = operatorsInClause.sort();
            if (!((_.isEqual(operatorsInClause, correctList1)) || (_.isEqual(operatorsInClause, correctList2)))) {
              throw new Error(`Error when trying to parse logical clause: ${clauseStr}. Operators found: ${operatorsInClause.join(', ')}`);
            }
            const longestOperator = operatorsInClause.sort((a, b) => b.length - a.length)[0];
            operatorsInClause[0] = longestOperator;
          }
          case 1: {
            const operatorIndex = clauseStr.indexOf(operatorsInClause[0]);
            const variable = clauseStr.substring(0, operatorIndex);
            const val = clauseStr.substring(operatorIndex + operatorsInClause[0].length);
            // updateGroupByVars(variable, operatorsInClause[0], val);
            break;
          }
          default:
            throw new Error(`Error: clause should contain a single operator. In clause ${clauseStr} 
                            operators found: ${operatorsInClause.join(', ')}`);
        }
      }
    }

    function getClauseToInsertObj(clauseStr) {
      const res = { [consts.CUR_CLAUSE_KEY]: '', [consts.PAST_CLAUSES_KEY]: '' };
      let clauseToInsert = formatter.formatAttr(clauseStr);
      const delimiterIndex = clauseToInsert.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
      const conditionStr = delimiterIndex >= 0 ? clauseToInsert.substring(0, delimiterIndex).trim()
        : clauseToInsert; // IF

      // todo replace these with assert
      if (delimiterIndex < 0 && conditionStr !== 'ELSE') {
        throw new Error(`Invalid conditional block! doesn't contain ${consts.LOGICAL_CONDITION_DELIMITER}`);
      } else if (delimiterIndex >= 0 && conditionStr === 'ELSE') {
        throw new Error(`Invalid ELSE conditional block! shouldn't contain ${consts.LOGICAL_CONDITION_DELIMITER}`);
      }

      clauseToInsert = (conditionStr.endsWith('IF')) ?
        clauseToInsert.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length)
          .trim().toUpperCase() : '';
      if (clauseToInsert !== '') {
        formatter.conditionalPrefix = conditionStr;
        res[consts.CUR_CLAUSE_KEY] = formatter.getFormattedClauseToInsert(clauseToInsert);
      }

      if (conditionStr.startsWith('ELSE')) {
        if (ClausesSet.size === 0) {
          let errMsg = 'ELSEIF or ELSE with no preceding conditions. ';
          errMsg += (clauseToInsert === '') ? '' :
            `Found in condition: ${clauseToInsert}`;
          throw new Error(errMsg);
        }
        const mappedClauses = Array.from(ClausesSet).map(x => `!(${x})`);
        const negationOfPastConditions = `(${mappedClauses.join('&&')})`;
        res[consts.PAST_CLAUSES_KEY] = negationOfPastConditions;
      }
      return res;
    }

    function getNextClauseIndex(stringToCheck) {
      const blocksIndexes = [stringToCheck.indexOf(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX),
        stringToCheck.indexOf(consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX),
        stringToCheck.indexOf(consts.CUSTOM_ELSE_BLOCK_TAG)].filter(x => x >= 0);
      if (blocksIndexes && blocksIndexes.length > 0) {
        return Math.min(...blocksIndexes);
      }
      return -1;
    }


    function preprocessAttrs(attrsObjToCast) {
      let postProcessinhAttrsObj = attrsObjToCast;
      if (postProcessinhAttrsObj instanceof Number || typeof postProcessinhAttrsObj === 'number') {
        return postProcessinhAttrsObj;
      } else if (postProcessinhAttrsObj instanceof String || typeof postProcessinhAttrsObj === 'string') {
        return postProcessinhAttrsObj;
      } else if (Array.isArray(postProcessinhAttrsObj)) {
        if (postProcessinhAttrsObj[0] instanceof String || typeof postProcessinhAttrsObj[0] === 'string') {
          postProcessinhAttrsObj = postProcessinhAttrsObj.map(s => formatter.formatAttr(s));
        }
        return postProcessinhAttrsObj;
      }
      Object.keys(postProcessinhAttrsObj).forEach((attr) => {
        let tmp = postProcessinhAttrsObj[attr];
        delete postProcessinhAttrsObj[attr];
        if ((tmp instanceof String || typeof tmp === 'string') && tmp != null) {
          tmp = tmp.toUpperCase();
          if (tmp.trim() === '') {
            tmp = null;
          }
        }
        if (tmp != null) {
          postProcessinhAttrsObj[formatter.formatAttr(attr)] = preprocessAttrs(tmp);
        }
      });
      return postProcessinhAttrsObj;
    }

    let strLeft = dataToTranslate;
    let openingClauseStartIndex = getNextClauseIndex(dataToTranslate);
    while (openingClauseStartIndex >= 0 && (!(dataToTranslate.substring(openingClauseStartIndex).startsWith(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX)))) {
      const condClauseIndex = dataToTranslate.substring(openingClauseStartIndex).indexOf(consts.CUSTOM_CLOSE_DELIMITER);
      const condClause = condClauseIndex >= 0 ? dataToTranslate.substring(openingClauseStartIndex, condClauseIndex + consts.CUSTOM_CLOSE_DELIMITER.length) : dataToTranslate.substring(openingClauseStartIndex);
      curCondBlockId += 1;
      updateCondBlocksCounters(condClause);
      addValidationResult(condClause, consts.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG);
      strLeft = strLeft.substring(openingClauseStartIndex + condClause.length);
      openingClauseStartIndex = getNextClauseIndex(strLeft);
    }
    let newStr = openingClauseStartIndex > 0 ? dataToTranslate.substring(0, openingClauseStartIndex) : '';
    if (openingClauseStartIndex >= 0) {
      strLeft = dataToTranslate.substring(openingClauseStartIndex);
      openingClauseStartIndex = 0;
    }
    while (openingClauseStartIndex >= 0 && strLeft) {
      const openingClauseEndIndex = strLeft.indexOf(consts.CUSTOM_CLOSE_DELIMITER) + consts.CUSTOM_CLOSE_DELIMITER.length;
      /*
          TODO: need  to handle the case when the inner var's sorrounded with [%%]. E.g. [%IF:[%Country%]=='Israel'%] - see the test [%%] in input string
          A quick thought: Check indexes of '[%' & '%]' in strLeft. If strLeft.IndexOf('%]')<strLeft.indexOf('[%') it means the var name is surrounded with such brackets and we need to advance
          openingClauseIndex to strLeft.IndexOf('%]') - and respectively openingClause & strLeft
          *Consider deleting the inner [%%] of the varName from the innerString (i.e. between the outermost [%%]) prior to proceeding (so that everything else will remain as is)
                            * */
      const openingClause = strLeft.substring(openingClauseStartIndex, openingClauseEndIndex).trim();
      updateCondBlocksCounters(openingClause);
      strLeft = strLeft.substring(openingClauseEndIndex);

      let endClauseStartIndex = strLeft.indexOf(consts.CUSTOM_CLOSING_IF_BLOCK_TAG);
      const nextCondClauseIndex = getNextClauseIndex(strLeft);
      if (endClauseStartIndex < 0 || (nextCondClauseIndex >= 0 && nextCondClauseIndex <= endClauseStartIndex)) {
        endClauseStartIndex = nextCondClauseIndex;
        addValidationResult(openingClause, `${consts.VALIDATION_BLOCK_MSG} - missing required closing clause ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`);
      }
      const curClauseToInsertObj = getClauseToInsertObj(openingClause);
      const curClauseToInsertStr =
                (curClauseToInsertObj[consts.CUR_CLAUSE_KEY] !== '' && curClauseToInsertObj[consts.PAST_CLAUSES_KEY] !== '') ?
                  `${curClauseToInsertObj[consts.CUR_CLAUSE_KEY]}&&(${curClauseToInsertObj[consts.PAST_CLAUSES_KEY]})`
                  : `${curClauseToInsertObj[consts.CUR_CLAUSE_KEY]}${curClauseToInsertObj[consts.PAST_CLAUSES_KEY]}`;

      if (openingClause.trim().startsWith(`${consts.CUSTOM_OPEN_DELIMITER}IF${consts.LOGICAL_CONDITION_DELIMITER}`)) {
        ClausesSet = new Set();
      }
      registerClause(curClauseToInsertObj[consts.CUR_CLAUSE_KEY]);

      newStr += `${consts.EJS_IF_BLOCK_PREFIX}${curClauseToInsertStr}${consts.EJS_IF_BLOCK_SUFFIX}`;
      newStr += strLeft.substring(0, endClauseStartIndex);
      newStr += consts.EJS_CLOSING_IF_BLOCK_TAG;

      strLeft = endClauseStartIndex === nextCondClauseIndex ?
        strLeft.substring(endClauseStartIndex) : strLeft.substring(endClauseStartIndex + consts.CUSTOM_CLOSING_IF_BLOCK_TAG.length);
      openingClauseStartIndex = getNextClauseIndex(strLeft);
    }
    let resStr = '';
    let attrsToEjs = attrsObj;
    if (attrsToEjs) {
      attrsToEjs = preprocessAttrs(attrsToEjs);
      /* todo: this fails in case there's IF:10<=PUBLIC_CUSTOMER_ID because it makes the translation be like:
                            attrs.10<=PUBLIC_CUSTOMER_ID - which doesn't make any sense!
                            */
      try {
        resStr = ejs.render(newStr, { attrs: attrsToEjs, moment });
      } catch (error) {
        const lintRes = ejsLint(newStr);
        throw new Error(`Error in ejs.render.\nlint obj details: ${decodeURI(JSON.stringify(lintRes))}.\nOriginal Exception details ${error}`);
      }
    }
    if (shouldReturnGroupByMapping) {
      prepareGroupByVarsForSending();
    }

    const outputObj = {
      [consts.OUTPUT_KEY_STR]: resStr,
      [consts.VALIDATE_OUTPUT_KEY_STR]: validationResults,
    };
    return outputObj;
  };
}(module.exports));
