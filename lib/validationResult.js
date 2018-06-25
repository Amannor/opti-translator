/* eslint-disable max-len */
const consts = require('./consts.js');

function ValidationResult(conditionalBlockId = consts.VALIDATION_UNASSIGNED_INDEX, innerBlockOrder = consts.VALIDATION_UNASSIGNED_INDEX, condition = '', errorMsg = '', details = '') {
  this.conditionalBlockId = conditionalBlockId;
  this.innerBlockOrder = innerBlockOrder;
  this.condition = condition;
  this.errorMsg = errorMsg;
  this.details = details;
}

function variableToCanonicalForm(variable) {
  if (variable && (variable instanceof String || typeof variable === 'string')) {
    return variable.replace(/\s/g, '').toUpperCase();
  }
  return variable;
}

ValidationResult.prototype.compareValidation = function (other) {
  if (this.conditionalBlockId !== other.conditionalBlockId) {
    return this.conditionalBlockId - other.conditionalBlockId;
  } else if (this.innerBlockOrder !== other.innerBlockOrder) {
    return this.innerBlockOrder - other.innerBlockOrder;
  } else if (variableToCanonicalForm(this.condition).localeCompare(variableToCanonicalForm(other.condition)) !== 0) {
    return variableToCanonicalForm(this.condition).localeCompare(variableToCanonicalForm(other.condition));
  } else if (variableToCanonicalForm(this.errorMsg).localeCompare(variableToCanonicalForm(other.errorMsg)) !== 0) {
    return variableToCanonicalForm(this.errorMsg).localeCompare(variableToCanonicalForm(other.errorMsg));
  }

  return variableToCanonicalForm(this.details).localeCompare(variableToCanonicalForm(other.details));
};
ValidationResult.prototype.isValidationEqual = function (other) {
  return this.compareValidation(other) === 0;
};

module.exports = ValidationResult;
