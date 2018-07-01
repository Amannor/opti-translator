/* eslint-disable max-len,no-param-reassign,consistent-return */
const _ = require('lodash');
const moment = require('moment');
const momentParseFormat = require('moment-parseformat');
const consts = require('./consts.js');
const tagPrefixes = require('./tagPrefixes.js');
const datetimeHelper = require('./datetimeHelper.js');

class condFormatter {
  constructor(reportValidationResFunc, attrsObj) {
    if (reportValidationResFunc instanceof Function) {
      this.reportValidationResFunc = reportValidationResFunc;
    }
    this.legalDatetimeMomentFormats = [];
    const datetimeTypesIds = datetimeHelper.DateTimeObjList.map(o => o[datetimeHelper.DATETIME_TYPE_ID_KEY]);
    datetimeTypesIds.forEach((type) => {
      const formats = datetimeHelper.GetLegalDateTimeFormats().map(legalFormat => this.convertToMomentFormat(legalFormat, type));
      this.legalDatetimeMomentFormats.push.apply(this.legalDatetimeMomentFormats, formats);
    });
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

  convertToMomentFormat(date, type) {
    Object.keys(condFormatter.condDateTimeFormatToMomentFormatMap[type]).forEach((condFormat) => {
      date = date.replace(new RegExp(condFormat, 'g'), condFormatter.condDateTimeFormatToMomentFormatMap[type][condFormat]);
    });
    return date;
  }

  formatAttr(attr) {
    const shouldFormat = attr && (attr instanceof String || typeof attr === 'string');
    let newAttr = attr;
    if (shouldFormat) {
      newAttr = newAttr.split(consts.CUSTOM_OPEN_DELIMITER).join('');
      newAttr = newAttr.split(consts.CUSTOM_CLOSE_DELIMITER).join('');
      newAttr = newAttr.toUpperCase();
      const prefixesToRemove = tagPrefixes.PersonalizationTagsPrefixes;
      prefixesToRemove.forEach((prefix) => {
        newAttr = newAttr.replace(`${prefix}${consts.LOGICAL_CONDITION_DELIMITER}`, '');
      });
      newAttr = newAttr.trim();
    }
    return newAttr;
  }

  reportValidationRes(clause, errMsg, details = '')   {
    if (this.reportValidationResFunc) {
      // Adding conditional prefix (e.g. "IF:") to the clause, if applicable
      if ((!(clause.startsWith(`ELSEIF${consts.LOGICAL_CONDITION_DELIMITER}`) || clause.startsWith(`IF${consts.LOGICAL_CONDITION_DELIMITER}`)))
        && (this.conditionalPrefix)) {
        if (!(this.conditionalPrefix.endsWith(consts.LOGICAL_CONDITION_DELIMITER))) {
          this.conditionalPrefix = `${this.conditionalPrefix}${consts.LOGICAL_CONDITION_DELIMITER}`;
        }
        clause = `${this.conditionalPrefix}${clause}`;
      }

      this.reportValidationResFunc(clause, errMsg, details);
    }
  }

  getFormattedClauseToInsert(clause) {
    let finalClause = this.encloseAttr(clause);
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
        const dateTimeClausePartsObj = Object.assign({}, clausePartsObj); // Cloning object to not affect attribute validity check later on in the function
        finalClause = this.clausePartsToDateTimeClauseStr(dateTimeClausePartsObj, dateTimeResObj.format);
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
      default: {
        const errMsg = `Error in CL formatter - SHOULD NEVER HAPPEN. Given operator ${origOp}`
        this.reportValidationRes(origClause, consts.VALIDATION_ILLEGAL_OP_MSG, errMsg);
        break;
      }
    }

    clausePartsObj[consts.CUR_VAL_KEY] = `moment(${clausePartsObj[consts.CUR_VAL_KEY]}, ${formatFound}))`;

    if (origOp === consts.OP_NEQ) {
      clausePartsObj[consts.CUR_VAR_KEY] = `!(${clausePartsObj[consts.CUR_VAR_KEY]}`;
      clausePartsObj[consts.CUR_VAL_KEY] = `${clausePartsObj[consts.CUR_VAL_KEY]})`;
    }

    return `${clausePartsObj[consts.CUR_VAR_KEY]}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
  }

  isExplicitValidDateTimeFormat(formatToCheck, explicitFormats) {
    explicitFormats.sort((a, b) => b.length - a.length);
    explicitFormats.forEach((eFormat) => {
      formatToCheck = formatToCheck.replace(eFormat, '');
    });

    const delimitersToIgnore = ['.', ':', '-', String.raw`\\`, '/'];
    formatToCheck = formatToCheck.replace(new RegExp(delimitersToIgnore.join('|'), 'g'), '');
    const isValid = formatToCheck.trim() === '';
    return isValid;
  }

  tryGetExplicitDateTimeFormat(variable, op, val) {
    const explicitDateTimeObjList = datetimeHelper.DateTimeObjList;
    for (let i = 0; i < explicitDateTimeObjList.length; i += 1) {
      const curObj = explicitDateTimeObjList[i];
      const tags = curObj[datetimeHelper.DATETIME_TAGS_KEY];
      for (let j = 0; j < tags.length; j += 1) {
        const tag = tags[j];
        if (variable === tag) {
          return {
            isExplicitFormat: true,
            explicitFormat: curObj[datetimeHelper.DATETIME_DEF_FORMAT_KEY],
            type: curObj[datetimeHelper.DATETIME_TYPE_ID_KEY],
          };
        } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
          const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
          const explicitFormatFound = variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length);
          if (explicitFormatFound.trim() === curObj[datetimeHelper.DATETIME_DEF_FORMAT_ALIAS_KEY]) {
            return {
              isExplicitFormat: true,
              explicitFormat: curObj[datetimeHelper.DATETIME_DEF_FORMAT_KEY],
              type: curObj[datetimeHelper.DATETIME_TYPE_ID_KEY],
            };
          }
          const formatsObj = curObj[datetimeHelper.DATETIME_FORMATS_KEY];
          const curObjFormats = Object.keys(formatsObj).map(formatKey => this.formatAttr(formatsObj[formatKey]));
          if (this.isExplicitValidDateTimeFormat(explicitFormatFound, curObjFormats)) {
            return {
              isExplicitFormat: true,
              explicitFormat: explicitFormatFound,
              type: curObj[datetimeHelper.DATETIME_TYPE_ID_KEY],
            };
          }
          this.reportValidationRes(`${variable}${op}${val}`, `${consts.VALIDATION_COND_MSG}: Illegal format entered - ${explicitFormatFound}`);
          return { explicitFormat: condFormatter.INTERNAL_VALIDATION_ERR };
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

    const explicitDateTimeObj = this.tryGetExplicitDateTimeFormat(variable, op, value);
    if (explicitDateTimeObj.isExplicitFormat === true) {
      const { explicitFormat, type } = explicitDateTimeObj;
      const momentFormat = this.convertToMomentFormat(explicitFormat, type);
      if (moment(value, momentFormat).isValid()) {
        return { isValidDateTime: true, format: momentFormat };
      }
      const clause = `${variable}${op}${value}`;
      this.reportValidationRes(clause, consts.VALIDATION_ILLEGAL_DATE_COMPARISON_MSG, `Variable format found ${explicitDateTimeObj.explicitFormat}`);
      return { isValidDateTime: false };
    } else if (explicitDateTimeObj.explicitFormat === condFormatter.INTERNAL_VALIDATION_ERR) {
      return { isValidDateTime: false };
    }


    let variableMomentFormat = this.varsToValues[variable] ? momentParseFormat(this.varsToValues[variable]) : '';
    if (variableMomentFormat.startsWith('\'')) { variableMomentFormat = variableMomentFormat.substring(1); }
    if (variableMomentFormat.endsWith('\'')) { variableMomentFormat = variableMomentFormat.substring(0, variableMomentFormat.length - 1); }

    let valueMomentFormat = value ? momentParseFormat(value) : '';
    if (valueMomentFormat.startsWith('\'')) { valueMomentFormat = valueMomentFormat.substring(1); }
    if (valueMomentFormat.endsWith('\'')) { valueMomentFormat = valueMomentFormat.substring(0, valueMomentFormat.length - 1); }

    if (variableMomentFormat === valueMomentFormat && variableMomentFormat !== ''
        && moment(this.varsToValues[variable], variableMomentFormat).isValid()
        && moment(value, valueMomentFormat).isValid()) {
      for (let i = 0; i < this.legalDatetimeMomentFormats.length; i += 1) {
        const legalMomentFormat = this.legalDatetimeMomentFormats[i];
        if (legalMomentFormat.includes(variableMomentFormat)) {
          return { isValidDateTime: true, format: variableMomentFormat };
        }
      }
    }

    // If both are false & non-egalitarian operator - addValidation Error
    return { isValidDateTime: false };
  }
}

condFormatter.condDateTimeFormatToMomentFormatMap = {
  // This list isn't exhaustive (items were added as needed). See ejs docs for all the valid formats
  // For brevity, formats for which the format and its' respective moment mapping are identical were omitted

  [datetimeHelper.TIME_TYPE_ID]: {
    [datetimeHelper.timeFormats.t2]: 'a',
    [datetimeHelper.timeFormats.T2]: 'A',
    // This entry is a workaround in case we manually uppercased the valid format given
    [datetimeHelper.timeFormats.m2.toUpperCase()]: datetimeHelper.timeFormats.m2,
  },
  [datetimeHelper.DATE_TYPE_ID]: {
    [datetimeHelper.dateFormats.y4]: 'YYYY',
    [datetimeHelper.dateFormats.d2]: 'DD',
  },

};
condFormatter.INTERNAL_VALIDATION_ERR = 'INTERNAL VALIDATION ERROR FOUND, NO PARSING NEEDED BEYOND THIS POINT';

module.exports = condFormatter;