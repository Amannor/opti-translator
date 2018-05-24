const consts = require('./consts.js');

function ValidationResult(conditionalBlockId = consts.VALIDATION_UNASSIGNED_INDEX, innerBlockOrder = consts.VALIDATION_UNASSIGNED_INDEX, condition = '', errorMsg = '', details = '') {
  this.conditionalBlockId = conditionalBlockId;
  this.innerBlockOrder = innerBlockOrder;
  this.condition = condition;
  this.errorMsg = errorMsg;
  this.details = details;
}

ValidationResult.prototype.compareValidation = function (other) {
  if (this.conditionalBlockId !== other.conditionalBlockId) {
    return this.conditionalBlockId - other.conditionalBlockId;
  } else if (this.innerBlockOrder !== other.innerBlockOrder) {
    return this.innerBlockOrder - other.innerBlockOrder;
  } else if (this.condition.toUpperCase().localeCompare(other.condition.toUpperCase()) != 0) {
    return this.condition.toUpperCase().localeCompare(other.condition.toUpperCase());
  } else if (this.errorMsg.toUpperCase().localeCompare(other.errorMsg.toUpperCase()) != 0) {
    return this.errorMsg.toUpperCase().localeCompare(other.errorMsg.toUpperCase());
  }

  return this.details.toUpperCase().localeCompare(other.details.toUpperCase());
};
ValidationResult.prototype.isValidationEqual = function (other) {
  return this.compareValidation(other) === 0;
};

module.exports = ValidationResult;
