module.exports = {
  OUTPUT_KEY_STR: 'output',
  ATTRIBUTES_KEY_STR: 'attrs',
  GROUP_BY_OUTPUT_KEY_STR: 'groupByRecommendations',
  DEFAULT_EJS_OPEN_DELIMITER: '<% ',
  VALIDATE_OUTPUT_KEY_STR: 'ValidationResults',
  DEFAULT_EJS_CLOSE_DELIMITER: ' %>',
  CUSTOM_OPEN_DELIMITER: '[%',
  CUSTOM_CLOSE_DELIMITER: '%]',
  CUSTOM_CLOSING_IF_BLOCK_TAG: '', // defined at end of this file
  CUSTOM_OPENING_IF_BLOCK_PREFIX: '', // defined at end of this file
  CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX: '', // defined at end of this file
  CUSTOM_ELSE_BLOCK_TAG: '', // defined at end of this file
  EJS_CONDITIONAL_BLOCK_OPEN: '{',
  EJS_CONDITIONAL_BLOCK_END: '}',
  OP_EQ: '==',
  OP_NEQ: '!=',
  OP_GT: '>',
  OP_GTE: '>=',
  OP_LT: '<',
  OP_LTE: '<=',
  LEGAL_OPERATORS: '', // defined at end of this file
  EGALITARIAN_OPERATORS: '', // defined at end of this file
  EXISTENCE_OPERATOR_FOR_GROUPBY: 'E', // simplified version of ∃ (see https://en.wikipedia.org/wiki/Turned_E)
  LOGICAL_CONDITION_DELIMITER: ':',
  EJS_IF_BLOCK_PREFIX: '', // defined at end of this file
  EJS_IF_BLOCK_SUFFIX: '', // defined at end of this file
  EJS_CLOSING_IF_BLOCK_TAG: '', // defined at end of this file
  CUR_CLAUSE_KEY: 'curClause',
  PAST_CLAUSES_KEY: 'pastConditionsNegated',
  CUR_OP_KEY: 'OP',
  CUR_VAR_KEY: 'VAR',
  CUR_VAL_KEY: 'VAL',
  VALIDATION_START_INDEX: 0,
  VALIDATION_UNASSIGNED_INDEX: '', // defined at end of this file
  VALIDATION_BLOCK_MSG: 'Invalid condition block',
  VALIDATION_COND_MSG: 'Invalid condition',
  VALIDATION_ILLEGAL_OP_MSG: '', // defined at end of this file
  VALIDATION_ILLEGAL_BLOCK_ORDER_MSG: '', // defined at end of this file
  VALIDATION_INPUT_KEY_MAX_BLOCKS_PER_TEMPLATE: 'MaxBlocksPerTemplate',
  VALIDATION_INPUT_KEY_MAX_CONDS_PER_BLOCK: 'MaxClausesPerBlock',
  VALIDATION_ILLEGAL_DATE_COMPARISON_MSG: '', // defined at end of this file
  STRING_AND_DATE_LITERAL_ENCLOSING: "'",
};
module.exports.CUSTOM_CLOSING_IF_BLOCK_TAG = `${module.exports.CUSTOM_OPEN_DELIMITER}END${module.exports.LOGICAL_CONDITION_DELIMITER}IF${module.exports.CUSTOM_CLOSE_DELIMITER}`;
module.exports.EJS_IF_BLOCK_PREFIX = `${module.exports.DEFAULT_EJS_OPEN_DELIMITER}if (`;
module.exports.EJS_IF_BLOCK_SUFFIX = `) ${module.exports.EJS_CONDITIONAL_BLOCK_OPEN}${module.exports.DEFAULT_EJS_CLOSE_DELIMITER}`;
module.exports.EJS_CLOSING_IF_BLOCK_TAG = `${module.exports.DEFAULT_EJS_OPEN_DELIMITER}${module.exports.EJS_CONDITIONAL_BLOCK_END}${module.exports.DEFAULT_EJS_CLOSE_DELIMITER}`;
module.exports.CUSTOM_OPENING_IF_BLOCK_PREFIX = `${module.exports.CUSTOM_OPEN_DELIMITER}IF${module.exports.LOGICAL_CONDITION_DELIMITER}`;
module.exports.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX = `${module.exports.CUSTOM_OPEN_DELIMITER}ELSEIF${module.exports.LOGICAL_CONDITION_DELIMITER}`;
module.exports.CUSTOM_ELSE_BLOCK_TAG = `${module.exports.CUSTOM_OPEN_DELIMITER}ELSE${module.exports.CUSTOM_CLOSE_DELIMITER}`;
module.exports.VALIDATION_UNASSIGNED_INDEX = module.exports.VALIDATION_START_INDEX - 1;
module.exports.LEGAL_OPERATORS = [module.exports.OP_EQ, module.exports.OP_NEQ, module.exports.OP_GT, module.exports.OP_GTE, module.exports.OP_LT, module.exports.OP_LTE];
module.exports.EGALITARIAN_OPERATORS = [module.exports.OP_EQ, module.exports.OP_NEQ];
module.exports.VALIDATION_ILLEGAL_OP_MSG = `${module.exports.VALIDATION_COND_MSG}: Illegal operator`;
module.exports.VALIDATION_ILLEGAL_BLOCK_ORDER_MSG = `${module.exports.VALIDATION_COND_MSG}: ELSE/ELSEIF with no preceding IF clause`;
module.exports.VALIDATION_ILLEGAL_DATE_COMPARISON_MSG = `${module.exports.VALIDATION_COND_MSG}: Can't compare dates of different formats`;
module.exports.VALIDATION_ILLEGAL_VALUE_MSG = `${module.exports.VALIDATION_COND_MSG}: Illegal value entered`;

