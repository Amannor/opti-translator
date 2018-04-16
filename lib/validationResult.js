const consts = require('./consts.js');
function ValidationResult (conditionalBlockId = consts.VALIDATION_UNASSIGNED_INDEX, innerBlockOrder = consts.VALIDATION_UNASSIGNED_INDEX, condition="", errorMsg="", details=""){
      this.conditionalBlockId = conditionalBlockId;
      this.innerBlockOrder = innerBlockOrder;
      this.condition = condition;
      this.errorMsg = errorMsg;
      this.details = details;
}

ValidationResult.prototype.compareValidation = function(other)
    {
       /*
        if(!other instanceof ValidationResult)
       {
          throw "Comparison must be between ValidationResult objects";
       }
       */
       if(this.conditionalBlockId != other.conditionalBlockId)
       {
           return this.conditionalBlockId - other.conditionalBlockId;
       }
       else if (this.innerBlockOrder != other.innerBlockOrder)
       {
           return this.innerBlockOrder - other.innerBlockOrder;
       }
       else if (this.condition.localeCompare(other.condition) != 0)
       {
           return this.condition.localeCompare(other.condition);
       }
       else if (this.errorMsg.localeCompare(other.errorMsg) != 0)
       {
          return this.errorMsg.localeCompare(other.errorMsg);
       }
       else
       {
          return this.details.localeCompare(other.details);
       }
    };
ValidationResult.prototype.isValidationEqual = function(other)
    {
        return this.compareValidation(other) == 0;
    };

module.exports = ValidationResult;
/*
export default class ValidationResult {
    constructor(conditionalBlockId = consts.VALIDATION_UNASSIGNED_INDEX, innerBlockOrder = consts.VALIDATION_UNASSIGNED_INDEX, condition="", errorMsg="", details="") {
      this.conditionalBlockId = conditionalBlockId;
      this.innerBlockOrder = innerBlockOrder;
      this.condition = condition;
      this.errorMsg = errorMsg;
      this.details = details;
    }

    static comp(rhs, lhs)
    {
       if(!(lhs instanceof ValidationResult && rhs instanceof ValidationResult))
       {
          throw "Comparison must be between ValidationResult objects";
       }
       if(lhs.conditionalBlockId != rhs.conditionalBlockId)
       {
           return lhs.conditionalBlockId - rhs.conditionalBlockId;
       }
       else if (lhs.innerBlockOrder != rhs.innerBlockOrder)
       {
           return lhs.innerBlockOrder - rhs.innerBlockOrder;
       }
       else if (lhs.condition.localeCompare(rhs.condition) != 0)
       {
           return lhs.condition.localeCompare(rhs.condition);
       }
       else if (lhs.errorMsg.localeCompare(rhs.errorMsg) != 0)
       {
          return lhs.errorMsg.localeCompare(rhs.errorMsg);
       }
       else
       {
          return lhs.details.localeCompare(rhs.details);
       }
    }

    static areEqual(lhs, rhs)
    {
        return comp(lhs, rhs) == 0;
    }
}
*/