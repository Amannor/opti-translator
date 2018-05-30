/* eslint-disable max-len,no-param-reassign,consistent-return */
const _ = require('lodash');
const moment = require('moment');
const consts = require('./consts.js');
const tagPrefixes = require('./tagPrefixes.js');
const datetimeHelper = require('./datetimeHelper.js');

const condDateTimeFormatToMomentFormatMap = {
  // This list isn't exhaustive (items were added as needed). See ejs docs for all the valid formats
  // For brevity, formats for which the format and its' respective moment mapping are identical were omitted
  [datetimeHelper.timeFormats.t2]: 'a',
  [datetimeHelper.timeFormats.T2]: 'A',

  [datetimeHelper.dateFormats.y4]: 'YYYY',
  [datetimeHelper.dateFormats.d2]: 'DD',
};

class condFormatter {
  constructor(reportValidationResFunc, attrsObj) {
    if (reportValidationResFunc instanceof Function) {
      this.reportValidationResFunc = reportValidationResFunc;
    }
    this.legalDatetimeMomentFormats = datetimeHelper.GetLegalDateTimeFormats().map(legalFormat => this.convertToMomentFormat(legalFormat));
    this.varsToValues = {};
    if (!(typeof attrsObj !== 'function' && (typeof attrsObj !== 'object' || attrsObj == null))) {
      try {
        Object.keys(attrsObj).forEach((key) => {
          this.varsToValues[this.formatAttr(key)] = attrsObj[key];
        });
      } catch (e) {
        this.varsToValues = {};
      }
    }
  }

  isAttrValid(attr) {
    if (this.varsToValues) {
      return Object.keys(this.varsToValues).indexOf(attr) >= 0;
    }
    return false;
  }

  convertToMomentFormat(date) {
    Object.keys(condDateTimeFormatToMomentFormatMap).forEach((condFormat) => {
      date = date.replace(new RegExp(condFormat, 'g'), condDateTimeFormatToMomentFormatMap[condFormat]);
    });
    return date;
  }

  formatAttr(attr) {
    const shouldFormat = attr && (attr instanceof String || typeof attr === 'string');
    let newAttr = attr;
    if (shouldFormat) {
      newAttr = attr.replace(consts.CUSTOM_OPEN_DELIMITER, '').replace(consts.CUSTOM_CLOSE_DELIMITER, '').toUpperCase();
      const prefixesToRemove = tagPrefixes.PersonalizationTagsPrefixes;
      prefixesToRemove.forEach((prefix) => {
        newAttr = newAttr.replace(`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}`, '');
      });
    }
    return newAttr;
  }

  reportValidationRes(clause, errMsg, details = '') {
    if (this.reportValidationResFunc) {
      this.reportValidationResFunc(clause, errMsg, details);
    }
  }

  getFormattedClauseToInsert(clause) {
    let finalClause;
    const clausePartsObj = {
      [consts.CUR_VAR_KEY]: clause,
      [consts.CUR_OP_KEY]: this.extractOperator(clause),
      [consts.CUR_VAL_KEY]: '',
    };
    if (clause && consts.LEGAL_OPERATORS.indexOf(clausePartsObj[consts.CUR_OP_KEY]) >= 0) {
      clausePartsObj[consts.CUR_VAR_KEY] = clause.substring(0, clause.indexOf(clausePartsObj[consts.CUR_OP_KEY]));
      clausePartsObj[consts.CUR_VAL_KEY] = clause.substring(clause.indexOf(clausePartsObj[consts.CUR_OP_KEY])
                + clausePartsObj[consts.CUR_OP_KEY].length);
      const dateTimeResObj = this.tryGetClauseDateTimeFormat(clausePartsObj[consts.CUR_VAR_KEY], clausePartsObj[consts.CUR_OP_KEY], clausePartsObj[consts.CUR_VAL_KEY]);

      if (dateTimeResObj.isValidDateTime) {
        finalClause = this.clausePartsToDateTimeClauseStr(clausePartsObj, dateTimeResObj.format);
      } else {
        finalClause = `${this.encloseAttr(clausePartsObj[consts.CUR_VAR_KEY])}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
      }
    }
    if (!(this.isAttrValid(clausePartsObj[consts.CUR_VAR_KEY]))) {
      this.reportValidationRes(clause, consts.VALIDATION_COND_MSG);
    }

    return finalClause;
  }

  extractOperator(clause) {
    let foundOperator = '';
    let operatorsInClause = consts.LEGAL_OPERATORS.filter((operator) => {
      const operatorIndex = clause.indexOf(operator);
      return operatorIndex > 0;
    });
    switch (operatorsInClause.length) {
      case 0:
      case 1:
        break;
      case 2: {
        const correctList1 = [consts.OP_LT, consts.OP_LTE].sort();
        const correctList2 = [consts.OP_GT, consts.OP_GTE].sort();
        operatorsInClause = operatorsInClause.sort();
        if ((_.isEqual(operatorsInClause, correctList1)) ||
                    (_.isEqual(operatorsInClause, correctList2))) {
          const longestOperator = operatorsInClause.sort((a, b) => b.length - a.length)[0];
          operatorsInClause[0] = longestOperator;
        }
        break;
      }
      default:
        break;
    }
    if (operatorsInClause.length >= 1) {
      if (operatorsInClause.length < 3 &&
                consts.LEGAL_OPERATORS.indexOf(operatorsInClause[0]) >= 0) {
        [foundOperator] = operatorsInClause;
      } else {
        this.reportValidationRes(clause, consts.VALIDATION_ILLEGAL_OP_MSG, `Operators found: ${operatorsInClause.join(',')}`);
      }
    }
    return foundOperator;
  }

  encloseAttr(attr) {
    return `${consts.ATTRIBUTES_KEY_STR}['${attr}']`;
  }

  clausePartsToDateTimeClauseStr(clausePartsObj, formatFound) {
    if (!formatFound || formatFound.trim() === '') {
      formatFound = moment.ISO_8601;
    } else {
      formatFound = `'${formatFound}'`;
    }

    const origClause = `${clausePartsObj[consts.CUR_VAR_KEY]}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
    const enclosedAttr = this.encloseAttr(clausePartsObj[consts.CUR_VAR_KEY]);
    clausePartsObj[consts.CUR_VAR_KEY] = `moment(${enclosedAttr}, ${formatFound})`;

    const origOp = clausePartsObj[consts.CUR_OP_KEY];
    switch (origOp) {
      case consts.OP_EQ:
      case consts.OP_NEQ:
        clausePartsObj[consts.CUR_OP_KEY] = '.isSame(';
        break;

      case consts.OP_LT:
        clausePartsObj[consts.CUR_OP_KEY] = '.isBefore(';
        break;

      case consts.OP_LTE:
        clausePartsObj[consts.CUR_OP_KEY] = '.isSameOrBefore(';
        break;
      case consts.OP_GT:
        clausePartsObj[consts.CUR_OP_KEY] = '.isAfter(';
        break;

      case consts.OP_GTE:
        clausePartsObj[consts.CUR_OP_KEY] = '.isSameOrAfter(';
        break;
      default:
        this.reportValidationRes(origClause, consts.VALIDATION_ILLEGAL_OP_MSG, `Error in CL formatter - SHOULD NEVER HAPPEN. Given operator ${origOp}`);
        break;
    }

    clausePartsObj[consts.CUR_VAL_KEY] = `moment(${clausePartsObj[consts.CUR_VAL_KEY]}, ${formatFound}))`;

    if (origOp === consts.OP_NEQ) {
      clausePartsObj[consts.CUR_VAR_KEY] = `!(${clausePartsObj[consts.CUR_VAR_KEY]}`;
      clausePartsObj[consts.CUR_VAL_KEY] = `${clausePartsObj[consts.CUR_VAL_KEY]})`;
    }

    return `${clausePartsObj[consts.CUR_VAR_KEY]}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
  }

  tryGetExplicitDateTimeFormat(variable) {
    const explicitDateTimeObjList = datetimeHelper.DateTimeObjList;
    for (let i = 0; i < explicitDateTimeObjList.length; i += 1) {
      const curObj = explicitDateTimeObjList[i];
      const tags = curObj[datetimeHelper.DATETIME_TAGS_KEY];
      for (let j = 0; j < tags.length; j += 1) {
        const tag = tags[j];
        if (variable === tag) {
          return { isExplicitFormat: true, explicitFormat: curObj[datetimeHelper.DATETIME_DEF_FORMAT_KEY] };
        } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
          const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
          const explicitFormatFound = this.convertToMomentFormat(variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length));
          return { isExplicitFormat: true, explicitFormat: explicitFormatFound };
        }
      }
    }

    return { isExplicitFormat: false };
  }

  tryGetClauseDateTimeFormat(variable, op, value) {
    if (!(value.startsWith(consts.STRING_AND_DATE_LITERAL_ENCLOSING)
            && value.endsWith(consts.STRING_AND_DATE_LITERAL_ENCLOSING))) {
      // If value is number literal than should be treated like regular number (even if originated from date)
      return { isValidDateTime: false };
    }

    const explicitDateTimeObj = this.tryGetExplicitDateTimeFormat(variable);
    if (explicitDateTimeObj.isExplicitFormat) {
      const momentFormat = this.convertToMomentFormat(explicitDateTimeObj.explicitFormat);
      if (moment(value, momentFormat).isValid()) {
        return { isValidDateTime: true, format: momentFormat };
      }
      const clause = `${variable}${op}${value}`;
      this.reportValidationRes(clause, consts.VALIDATION_ILLEGAL_DATE_COMPARISON_MSG, `Variable format found ${explicitDateTimeObj.explicitFormat}`);
      return { isValidDateTime: false };
    }

    let foundLegalFormatForVariable = false;
    let foundLegalFormatForValue = false;

    for (let i = 0; i < this.legalDatetimeMomentFormats.length; i += 1) {
      const legalMomentFormat = this.legalDatetimeMomentFormats[i];
      const isCurVarFormatValid = this.varsToValues[variable] && moment(this.varsToValues[variable], legalMomentFormat).isValid();
      const isCurValFormatValid = moment(value, legalMomentFormat).isValid();
      if (isCurVarFormatValid && isCurValFormatValid) {
        return { isValidDateTime: true, format: legalMomentFormat };
      }
      foundLegalFormatForVariable = foundLegalFormatForVariable || isCurVarFormatValid;
      foundLegalFormatForValue = foundLegalFormatForValue || isCurValFormatValid;
    }

    if ((foundLegalFormatForVariable && (!(foundLegalFormatForValue))) ||
       ((!(foundLegalFormatForVariable)) && foundLegalFormatForValue)) {
      const clause = `${variable}${op}${value}`;
      this.reportValidationRes(clause, consts.VALIDATION_ILLEGAL_DATE_COMPARISON_MSG);
    }

    return { isValidDateTime: false };
    /*
        Todo:
        0) Create an empty list of foundVariableFormats & foundValuesFormats
        1) If in explicit mode (i.e. the variable is one of the known kjeywords up to explicit formatting):
          1.1) Find out the format - either explicit or implicit (default) - and add it as a single item to the list
        2) Else:
           Go over all the legalFormats and forEach:
            If moment(variable, curFormat).isValid() - add it to the list
        3) forEach possible format found for the variable see if the value can be casted into it - if so return it + isValidDateTime: true
        *IMPORTANT - see that it's not degeneracy in that every date literal returns moment,isValid for every format (e.g. "23:04" got casted successfully...)

        * */
  }
}


module.exports = condFormatter;
