//import ValidationResult from './validationResult';
(function (ejsTranslator) {
    const ejs = require('ejs');
    const decode = require('unescape');
    var _ = require('lodash');
    const ejsLint = require('ejs-lint');
    const consts = require('./consts.js');
    const tagPrefixes = require('./tagPrefixes.js');
    var ValidationResult = require("./validationResult.js");

    var shouldReturnValidations = true;
    var curCondBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
    var curInnerBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
    var maxAllowedConditionalBlocks = null;
    var maxAllowedClausesPerBlock = null;
    var validationResults = [];

    function addValidationResult(condition, errMsg="", details="", condBlockId = curCondBlockId, innerBlockId = curInnerBlockId) {
       if(shouldReturnValidations)
       {
           var res = new ValidationResult(condBlockId, innerBlockId, condition, errMsg, details);
           validationResults.push(res);
       }
    }

    function updateCondBlocksCounters(condClause)
    {
        if(condClause.startsWith(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX))
        {
            curCondBlockId++;
            curInnerBlockId = consts.VALIDATION_START_INDEX;
            if(maxAllowedConditionalBlocks && typeof maxAllowedConditionalBlocks == 'number' && maxAllowedConditionalBlocks > 0 && maxAllowedConditionalBlocks < curCondBlockId+1)
            {
                addValidationResult(condClause, `${consts.VALIDATION_BLOCK_MSG}: block #${curCondBlockId+1} exceeds max number of allowed blocks: ${maxAllowedConditionalBlocks}`)
            }
        }
        else if(condClause.startsWith(`${consts.CUSTOM_OPEN_DELIMITER}ELSE`))
        {
            curInnerBlockId++;
            if(maxAllowedClausesPerBlock && typeof maxAllowedClausesPerBlock == 'number' && maxAllowedClausesPerBlock > 0 && maxAllowedClausesPerBlock < curInnerBlockId+1)
            {
                addValidationResult(condClause, `${consts.VALIDATION_BLOCK_MSG}: condition #${curInnerBlockId+1} exceeds max number of allowed conditions per block: ${maxAllowedClausesPerBlock}`)
            }
        }
    }

    function init()
    {
        curCondBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
        curInnerBlockId = consts.VALIDATION_UNASSIGNED_INDEX;
        validationResults = [];
    }

    ejsTranslator.translateToEjs = function (dataToTranslate, attrsObj, shouldReturnGroupByMapping, shouldValidate, maxClausesPerBlock, maxCondBlocks) {

        init();
        shouldReturnValidations = shouldValidate;
        maxAllowedClausesPerBlock = maxClausesPerBlock;
        maxAllowedConditionalBlocks = maxCondBlocks;
        var ClausesSet = new Set();
        var GroupByVars = {};
        /* 
            groupByVars format:
            {"AVG_ORDER_VAL" :
                    {"<=" : [100, 300, 500] , "==" : [10,150]}
             "LANGUAGE" :
                    {"!=" : [English, Spanish] , "E" : []}
            }
        */
        function prepareGroupByVarsForSending()
        {
            Object.keys(GroupByVars).forEach(function (variable) {
                //e.g. variable: "AVG_ORDER_VAL"
                Object.keys(GroupByVars[variable]).forEach(function (operator) {
                    //e.g. operator: "<="
                    var valsSet = GroupByVars[variable][operator];
                    //changing set to array (for serialization) and sorting while we're at it
                    GroupByVars[variable][operator] = [...(valsSet)].sort(); 
                });
            });
        }

        function updateGroupByVars(variable, operator = consts.EXISTENCE_OPERATOR_FOR_GROUPBY,
            val = null)
        {
            if (!GroupByVars[variable]) { GroupByVars[variable] = {};}
            if (!GroupByVars[variable][operator]) { GroupByVars[variable][operator] = new Set(); }
            if (operator == consts.EXISTENCE_OPERATOR_FOR_GROUPBY) { return; }
            GroupByVars[variable][operator].add(val);
        }

        function registerClause(clauseStr) {
            clauseStr = clauseStr.replace(`${consts.ATTRIBUTES_KEY_STR}.`, '');
            if (!clauseStr) { return; }
            ClausesSet.add(clauseStr);
            if (shouldReturnGroupByMapping) {
                var operatorsInClause = consts.LEGAL_OPERATORS.filter(function (operator) {
                    var operatorIndex = clauseStr.indexOf(operator);
                    return operatorIndex > 0; 
                });
                switch (operatorsInClause.length) {
                    case 0:
                        updateGroupByVars(clauseStr);
                        break;
                    case 2:
                        //todo - write this prettier
                        correctList1 = ["<", "<="].sort();
                        correctList2 = [">", ">="].sort();
                        operatorsInClause = operatorsInClause.sort();
                        if (!((_.isEqual(operatorsInClause, correctList1)) || (_.isEqual(operatorsInClause, correctList2))))
                        {
                            throw `Error when trying to parse logical clause: ${clauseStr}. Operators found: ${operatorsInClause.join(", ")}`;
                        }
                        var longestOperator = operatorsInClause.sort(function (a, b) { return b.length - a.length; })[0];
                        operatorsInClause[0] = longestOperator;
                    case 1:
                        var operatorIndex = clauseStr.indexOf(operatorsInClause[0]);
                        var variable = clauseStr.substring(0, operatorIndex);
                        var val = clauseStr.substring(operatorIndex + operatorsInClause[0].length);
                        updateGroupByVars(variable, operatorsInClause[0], val);
                        break;
                    default:
                        throw `Error: clause should contain a single operator. In clause ${clauseStr} 
                            operators found: ${operatorsInClause.join(", ")}`;
                }
            }
        }

        function getClauseToInsertObj(clauseStr, openDelimiter = consts.CUSTOM_OPEN_DELIMITER, closeDelimiter = consts.CUSTOM_CLOSE_DELIMITER) {
            var res = { [consts.CUR_CLAUSE_KEY]: "", [consts.PAST_CLAUSES_KEY]: "" };
            var clauseToInsert = formatAttr(clauseStr);
              /*  clauseStr.trim()
                .substring(clauseStr.indexOf(consts.CUSTOM_OPEN_DELIMITER) + consts.CUSTOM_OPEN_DELIMITER.length,
                clauseStr.lastIndexOf(consts.CUSTOM_CLOSE_DELIMITER)).trim(); //IF:AVG_ORDER_VALUE>200
                */
            var delimiterIndex = clauseToInsert.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
            var conditionStr = delimiterIndex >= 0 ? clauseToInsert.substring(0, delimiterIndex).trim()
                : clauseToInsert; //IF

            //todo replace these with assert
            if (delimiterIndex < 0 && conditionStr != "ELSE") {
                throw `Invalid conditional block! doesn't contain ${consts.LOGICAL_CONDITION_DELIMITER}`;
            } else if (delimiterIndex >= 0 && conditionStr == "ELSE") {
                throw `Invalid ELSE conditional block! shouldn't contain ${consts.LOGICAL_CONDITION_DELIMITER}`;
            }

            clauseToInsert = (conditionStr.endsWith("IF")) ?
                clauseToInsert.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length)
                    .trim().toUpperCase() : "";
            if (clauseToInsert != "") { res[consts.CUR_CLAUSE_KEY] = `${consts.ATTRIBUTES_KEY_STR}.${clauseToInsert}`; }

            if (conditionStr.startsWith("ELSE")) {
                if (ClausesSet.size == 0) {
                    var errMsg = "ELSEIF or ELSE with no preceding conditions. "
                    errMsg += (clauseToInsert == "") ? "" :
                        `Found in condition: ${clauseToInsert}`;
                    throw errMsg;
                }
                mappedClauses = Array.from(ClausesSet).map(x => `${consts.ATTRIBUTES_KEY_STR}.${x}`); 
                var negationOfPastConditions = `!((${mappedClauses.join(")||(")}))`;
                if (ClausesSet.size == 1) { negationOfPastConditions = negationOfPastConditions.replace("!((", "!(").replace("))", ")"); }//todo - write this prettier
                res[consts.PAST_CLAUSES_KEY] = negationOfPastConditions
            }
            return res;
        }

        function getNextClauseIndex(stringToCheck)
        {
            var blocksIndexes = [stringToCheck.indexOf(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX),
                stringToCheck.indexOf(consts.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX),
                stringToCheck.indexOf(consts.CUSTOM_ELSE_BLOCK_TAG)].filter(x => x >= 0);
            if (blocksIndexes && blocksIndexes.length > 0)
            {
                return Math.min(...blocksIndexes);
            }
            else
            {
                return -1;
            }
        }

        function formatAttr(attr)
        {
            var shouldFormat = attr && (attr instanceof String || typeof attr == 'string');
            if(shouldFormat)
            {
                attr = attr.replace(consts.CUSTOM_OPEN_DELIMITER, "").replace(consts.CUSTOM_CLOSE_DELIMITER, "").toUpperCase();
                var prefixesToRemove = tagPrefixes.PersonalizationTagsPrefixes;
                prefixesToRemove.forEach( function(prefix){
                    attr = attr.replace(`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}`, "");
                });
            }
            return attr;

        }

        function preprocessAttrs(attrsObjToCast) {
            if (attrsObjToCast instanceof Number || typeof attrsObjToCast == 'number') {
                return attrsObjToCast;
            }
            else if (attrsObjToCast instanceof String || typeof attrsObjToCast == 'string') {
                //return attrsObjToCast.replace('[%', '').replace('%]', '').toUpperCase();
                return  attrsObjToCast;
            }
            else if (Array.isArray(attrsObjToCast)) {
                if (attrsObjToCast[0] instanceof String || typeof attrsObjToCast[0] == 'string') {
                    //attrsObjToCast = attrsObjToCast.map(s => s.replace('[%', '').replace('%]', '').toUpperCase());
                    attrsObjToCast = attrsObjToCast.map(s => formatAttr(s));
                }
                return attrsObjToCast;
            }
            Object.keys(attrsObjToCast).forEach(function (attr) {
                var tmp = attrsObjToCast[attr];
                delete attrsObjToCast[attr];
                if((tmp instanceof String || typeof tmp == 'string') && tmp != null)
                {
                    tmp = tmp.toUpperCase();
                    if(tmp.trim() == ''){tmp=null;}
                }
                if(tmp != null){
                    //attrsObjToCast[attr.replace('[%', '').replace('%]', '').toUpperCase()] = preprocessAttrs(tmp);
                    attrsObjToCast[formatAttr(attr)] = preprocessAttrs(tmp);
                }
            });
            return attrsObjToCast;
        } 

        dataToTranslate = decode(dataToTranslate);
        var openingClauseStartIndex = dataToTranslate.indexOf(consts.CUSTOM_OPENING_IF_BLOCK_PREFIX); 
        var newStr = openingClauseStartIndex > 0 ? dataToTranslate.substring(0, openingClauseStartIndex) : "";
        var strLeft = dataToTranslate;
        if (openingClauseStartIndex >= 0) {
            strLeft = dataToTranslate.substring(openingClauseStartIndex);
            openingClauseStartIndex = 0;
        }
        while (openingClauseStartIndex >= 0 && strLeft) {
            var openingClauseEndIndex = strLeft.indexOf(consts.CUSTOM_CLOSE_DELIMITER) + consts.CUSTOM_CLOSE_DELIMITER.length;
            /*
                TODO: need  to handle the case when the inner var's sorrounded with [%%]. E.g. [%IF:[%Country%]=='Israel'%] - see the test [%%] in input string
                A quick thought: Check indexes of '[%' & '%]' in strLeft. If strLeft.IndexOf('%]')<strLeft.indexOf('[%') it means the var name is surrounded with such brackets and we need to advance
                openingClauseIndex to strLeft.IndexOf('%]') - and respectively openingClause & strLeft
                *Consider deleting the inner [%%] of the varName from the innerString (i.e. between the outermost [%%]) prior to proceeding (so that everything else will remain as is)
            * */
            var openingClause = strLeft.substring(openingClauseStartIndex, openingClauseEndIndex).trim();
            updateCondBlocksCounters(openingClause);
            strLeft = strLeft.substring(openingClauseEndIndex);

            var endClauseStartIndex = strLeft.indexOf(consts.CUSTOM_CLOSING_IF_BLOCK_TAG);
            var nextCondClauseIndex = getNextClauseIndex(strLeft);
            if (endClauseStartIndex < 0 || (0 <= nextCondClauseIndex && nextCondClauseIndex <= endClauseStartIndex)) {
                endClauseStartIndex = nextCondClauseIndex;
                addValidationResult(openingClause, `${consts.VALIDATION_BLOCK_MSG} - missing required closing clause ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`);

                /*throw `ERROR: Invalid or missing end block. Every conditional block should end with
                    ${consts.CUSTOM_CLOSING_IF_BLOCK_TAG}`;
                */

            }
            var curClauseToInsertObj = getClauseToInsertObj(openingClause);
            var curClauseToInsertStr =
                (curClauseToInsertObj[consts.CUR_CLAUSE_KEY] != "" && curClauseToInsertObj[consts.PAST_CLAUSES_KEY] != "") ?
                    `${curClauseToInsertObj[consts.CUR_CLAUSE_KEY]}&&(${curClauseToInsertObj[consts.PAST_CLAUSES_KEY]})`
                    : `${curClauseToInsertObj[consts.CUR_CLAUSE_KEY]}${curClauseToInsertObj[consts.PAST_CLAUSES_KEY]}`;

            if (openingClause.trim().startsWith(`${consts.CUSTOM_OPEN_DELIMITER}IF${consts.LOGICAL_CONDITION_DELIMITER}`)) {
                ClausesSet = new Set();
            }
            registerClause(curClauseToInsertObj[consts.CUR_CLAUSE_KEY]);

            newStr += `${consts.EJS_IF_BLOCK_PREFIX}${curClauseToInsertStr}${consts.EJS_IF_BLOCK_SUFFIX}`;
            newStr += strLeft.substring(0, endClauseStartIndex);
            newStr += consts.EJS_CLOSING_IF_BLOCK_TAG;

            strLeft = endClauseStartIndex == nextCondClauseIndex ?
                strLeft.substring(endClauseStartIndex) : strLeft.substring(endClauseStartIndex + consts.CUSTOM_CLOSING_IF_BLOCK_TAG.length);
            openingClauseStartIndex = getNextClauseIndex(strLeft);
        }
        var resStr = "";
        if (attrsObj) {
            attrsObj = preprocessAttrs(attrsObj);
            /*todo: this fails in case there's IF:10<=PUBLIC_CUSTOMER_ID because it makes the translation be like:
            attrs.10<=PUBLIC_CUSTOMER_ID - which doesn't make any sense!
            */
            try {
                resStr = ejs.render(newStr, { attrs: attrsObj });
            } catch (error)
            {
                var lintRes = ejsLint(newStr);
                throw `Error in ejs.render.\nlint obj details: ${decodeURI(JSON.stringify(lintRes))}.\nOriginal Exception details ${error}`;
            }
        }
        if (shouldReturnGroupByMapping)
        {
            prepareGroupByVarsForSending();
        }

        var outputObj = {
            [consts.OUTPUT_KEY_STR]: resStr,
            [consts.VALIDATE_OUTPUT_KEY_STR]: validationResults
        };
        return outputObj;
    };

})(module.exports);