/* eslint-disable max-len,no-param-reassign,consistent-return */
const _ = require('lodash');
const moment = require('moment');
const consts = require('./consts.js');
const tagPrefixes = require('./tagPrefixes.js');
const datetimeHelper = require('./datetimeHelper.js');

const condDateTimeFormatToMomentFormatMap = {
  // This list isn't exhaustive (items were aded on only if needed). See ejs docs for all the valid formats
  // For brevity, formats for which the format and its' moment mapping are identical were omitted
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

  reportValidationRes(clause, errMsg) {
    if (this.reportValidationResFunc) { this.reportValidationResFunc(clause, errMsg); }
  }

  getClauseToInsert(clause) {
    let finalClause;
    const clausePartsObj = {
      [consts.CUR_VAR_KEY]: clause,
      [consts.CUR_OP_KEY]: this.extractOperator(clause),
      [consts.CUR_VAL_KEY]: '',
    };
    let isValidDateTime = false;
    if (clause && clausePartsObj[consts.CUR_OP_KEY].trim() !== '') {
      clausePartsObj[consts.CUR_VAR_KEY] = clause.substring(0, clause.indexOf(clausePartsObj[consts.CUR_OP_KEY]));
      clausePartsObj[consts.CUR_VAL_KEY] = clause.substring(clause.indexOf(clausePartsObj[consts.CUR_OP_KEY])
          + clausePartsObj[consts.CUR_OP_KEY].length);
      const dateTimeResObj = this.tryGetClauseDateTimeFormat(clausePartsObj[consts.CUR_VAR_KEY], clausePartsObj[consts.CUR_VAL_KEY]);
      isValidDateTime = dateTimeResObj.isValidDateTime;
      if (isValidDateTime) {
        if (!(this.isAttrValid(clausePartsObj[consts.CUR_VAR_KEY]))) {
          this.reportValidationRes(clause, consts.VALIDATION_COND_MSG);
        }
        finalClause = this.clausePartsToDateTimeClauseStr(clausePartsObj, dateTimeResObj.format);
      } else {
        finalClause = `${this.encloseAttr(clausePartsObj[consts.CUR_VAR_KEY])}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
      }
    }
    if (!(isValidDateTime || this.isAttrValid(clausePartsObj[consts.CUR_VAR_KEY]))) {
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
    if (!formatFound || formatFound.trim() === '') { formatFound = moment.ISO_8601; } else { formatFound = `'${formatFound}'`; }

    const enclosedAttr = this.encloseAttr(clausePartsObj[consts.CUR_VAR_KEY]);
    clausePartsObj[consts.CUR_VAR_KEY] = `moment(${enclosedAttr}, ${formatFound})`;

    let momentOp = '';
    switch (clausePartsObj[consts.CUR_OP_KEY]) {
      case consts.OP_EQ:
      case consts.OP_NEQ:
        momentOp = '.isSame(';
        break;

      case consts.OP_LT:
        momentOp = '.isBefore(';
        break;

      case consts.OP_LTE:
        momentOp = '.isSameOrBefore(';
        break;
      case consts.OP_GT:
        momentOp = '.isAfter(';
        break;

      case consts.OP_GTE:
        momentOp = '.isSameOrAfter(';
        break;
      default: break;
    }
    clausePartsObj[consts.CUR_OP_KEY] = momentOp;

    clausePartsObj[consts.CUR_VAL_KEY] = `moment(${clausePartsObj[consts.CUR_VAL_KEY]}, ${formatFound}))`;

    if (clausePartsObj[consts.CUR_OP_KEY] === consts.OP_NEQ) {
      clausePartsObj[consts.CUR_VAR_KEY] = `!(${clausePartsObj[consts.CUR_VAR_KEY]}`;
      clausePartsObj[consts.CUR_VAL_KEY] = `${clausePartsObj[consts.CUR_VAL_KEY]})`;
    }

    return `${clausePartsObj[consts.CUR_VAR_KEY]}${clausePartsObj[consts.CUR_OP_KEY]}${clausePartsObj[consts.CUR_VAL_KEY]}`;
  }

  tryGetClauseDateTimeFormat(variable, value) {
    if (!(value.startsWith(consts.STRING_AND_DATE_LITERAL_ENCLOSING)
        && value.endsWith(consts.STRING_AND_DATE_LITERAL_ENCLOSING))) {
      // If value is number literal than should be treated like regular number (even if originated from date)
      return { isValidDateTime: false };
    }
    let formatFound = '';


    // First try to conclude from variable
    for (let i = 0; i < [...datetimeHelper.TimeTags].length; i += 1) {
      const tag = [...datetimeHelper.TimeTags][i];
      if (variable === tag) {
        formatFound = this.convertToMomentFormat(datetimeHelper.DefaultTimeFormat);
        return { isValidDateTime: true, format: formatFound };
      } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
        const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
        formatFound = this.convertToMomentFormat(variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length));
        return { isValidDateTime: true, format: formatFound };
      }
    }

    for (let i = 0; i < [...datetimeHelper.DateTags].length; i += 1) {
      const tag = [...datetimeHelper.DateTags][i];
      if (variable === tag) {
        formatFound = this.convertToMomentFormat(datetimeHelper.DefaultDateFormat);
        return { isValidDateTime: true, format: formatFound };
      } else if (variable.startsWith(`${tag}${consts.LOGICAL_CONDITION_DELIMITER}`)) {
        const delimiterIndex = variable.indexOf(consts.LOGICAL_CONDITION_DELIMITER);
        formatFound = this.convertToMomentFormat(variable.substring(delimiterIndex + consts.LOGICAL_CONDITION_DELIMITER.length));
        return { isValidDateTime: true, format: formatFound };
      }
    }

    // If weren't able to deduce from variable, moving on to look at the value
    for (let i = 0; i < this.legalDatetimeMomentFormats.length; i += 1) {
      const legalFormat = this.legalDatetimeMomentFormats[i];
      if (moment(value, legalFormat).isValid()) {
        return { isValidDateTime: true, format: legalFormat };
      }
    }

    return { isValidDateTime: false };
  }
}


module.exports = condFormatter;
