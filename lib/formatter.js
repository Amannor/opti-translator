/* eslint-disable max-len,no-param-reassign,consistent-return */
const _ = require('lodash');
const moment = require('moment');
const consts = require('./consts.js');
const tagPrefixes = require('./tagPrefixes.js');
const datetimeHelper = require('./datetimeHelper.js');

const condDateTimeFormatToMomentFormatMap = {
  // This list isn't exhaustive. See ejs docs for more valid formats
  // For brevity, formats for which the format and its' moment mapping are identical aren't in this list
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
    try {
      this.legalAttributes = (typeof attrsObj !== 'function' && (typeof attrsObj !== 'object' || attrsObj == null)) ? [] : Object.keys(attrsObj).map(x => this.formatAttr(x));
    } catch (e) {
      this.legalAttributes = [];
    }
    this.legalDatetimeMomentFormats = datetimeHelper.GetLegalDateTimeFormats().map(legalFormat => this.convertToMomentFormat(legalFormat));
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

  reportValidationRes(clause, errMsg) {
    if (this.reportValidationResFunc) { this.reportValidationResFunc(clause, errMsg); }
  }

  getClauseToInsert(clauseStr) {
    const clauseParts = this.extractClauseParts(clauseStr);
    return `${this.encloseAttr(clauseParts[consts.CUR_VAR_KEY])}${clauseParts[consts.CUR_OP_KEY]}${clauseParts[consts.CUR_VAL_KEY]}`;
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

  clausePartsToDateTime(clausePartsObj, formatFound) {
    if (clausePartsObj[consts.CUR_OP_KEY] !== consts.OP_EQ &&
        clausePartsObj[consts.CUR_OP_KEY] !== consts.OP_NEQ) {
      if (!formatFound || formatFound.trim() === '') { formatFound = moment.ISO_8601; }
      //      if (moment(clausePartsObj[consts.CUR_VAL_KEY], moment.ISO_8601).isValid()) {
      clausePartsObj[consts.CUR_VAR_KEY] = `moment(${clausePartsObj[consts.CUR_VAR_KEY]}, ${formatFound})`;
      clausePartsObj[consts.CUR_VAL_KEY] = `moment(${clausePartsObj[consts.CUR_VAR_KEY]}, ${formatFound})`;
      //    }
    }
    return clausePartsObj;
  }

  extractClauseParts(clause) {
    let clausePartsObj = {
      [consts.CUR_VAR_KEY]: clause,
      [consts.CUR_OP_KEY]: this.extractOperator(clause),
      [consts.CUR_VAL_KEY]: '',
    };
    if (clause && clausePartsObj[consts.CUR_OP_KEY].trim() !== '') {
      clausePartsObj[consts.CUR_VAR_KEY] = clause.substring(0, clause.indexOf(clausePartsObj[consts.CUR_OP_KEY]));
      clausePartsObj[consts.CUR_VAL_KEY] = clause.substring(clause.indexOf(clausePartsObj[consts.CUR_OP_KEY])
          + clausePartsObj[consts.CUR_OP_KEY].length);
      const dateTimeResObj = this.tryGetClauseDateTimeFormat(clausePartsObj[consts.CUR_VAR_KEY], clausePartsObj[consts.CUR_VAL_KEY]);
      if (dateTimeResObj.isValidDatetime) {
        clausePartsObj = this.clausePartsToDateTime(clausePartsObj, dateTimeResObj.format);
      }
    }
    if (this.legalAttributes.indexOf(clausePartsObj[consts.CUR_VAR_KEY]) < 0) {
      this.reportValidationRes(clause, consts.VALIDATION_COND_MSG);
    }

    return clausePartsObj;
  }

  tryGetClauseDateTimeFormat(variable, value) {
    [...datetimeHelper.TimeTags].forEach((tag) => {
      if (variable === tag) {
        return { isValidDatetime: true, format: datetimeHelper.DefaultTimeFormat };
      } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
        const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
        const formatFound = variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length);
        return { isValidDatetime: true, format: formatFound };
      }
    });

    [...datetimeHelper.DateTags].forEach((tag) => {
      if (variable === tag) {
        return { isValidDatetime: true, format: datetimeHelper.DefaultDateFormat };
      } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
        const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
        const formatFound = variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length);
        return { isValidDatetime: true, format: formatFound };
      }
    });


    this.legalDatetimeMomentFormats.forEach((legalFormat) => {
      if (moment(value, legalFormat).isValid()) {
        return { isValidDatetime: true, format: legalFormat };
      }
    });

    return { isValidDatetime: false };
  }
}


module.exports = condFormatter;
