module.exports = {
    OUTPUT_KEY_STR: "output",
    ATTRIBUTES_KEY_STR: "attrs",
    GROUP_BY_OUTPUT_KEY_STR: "groupByRecommendations",
    DEFAULT_EJS_OPEN_DELIMITER: "<% ",
    VALIDATE_OUTPUT_KEY_STR: "ValidationResults",
    DEFAULT_EJS_CLOSE_DELIMITER: " %>",
    CUSTOM_OPEN_DELIMITER: "[%",
    CUSTOM_CLOSE_DELIMITER: "%]",
    CUSTOM_CLOSING_IF_BLOCK_TAG: "",//defined at end of this file
    CUSTOM_OPENING_IF_BLOCK_PREFIX: "",//defined at end of this file
    CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX: "",//defined at end of this file
    CUSTOM_ELSE_BLOCK_TAG: "",//defined at end of this file
    EJS_CONDITIONAL_BLOCK_OPEN: "{",
    EJS_CONDITIONAL_BLOCK_END: "}",
    LEGAL_OPERATORS: ["==", "!=", ">", "<", ">=", "<="],
    EXISTENCE_OPERATOR_FOR_GROUPBY: "E", // simplified version of ∃ (see https://en.wikipedia.org/wiki/Turned_E)
    LOGICAL_CONDITION_DELIMITER: ":",
    EJS_IF_BLOCK_PREFIX: "",//defined at end of this file
    EJS_IF_BLOCK_SUFFIX: "",//defined at end of this file
    EJS_CLOSING_IF_BLOCK_TAG: "",//defined at end of this file
    CUR_CLAUSE_KEY: "curClause",
    PAST_CLAUSES_KEY: "pastConditionsNegated"
};
module.exports.CUSTOM_CLOSING_IF_BLOCK_TAG = `${module.exports.CUSTOM_OPEN_DELIMITER}END${module.exports.LOGICAL_CONDITION_DELIMITER}IF${module.exports.CUSTOM_CLOSE_DELIMITER}`;
module.exports.EJS_IF_BLOCK_PREFIX = `${module.exports.DEFAULT_EJS_OPEN_DELIMITER}if (`;
module.exports.EJS_IF_BLOCK_SUFFIX = `) ${module.exports.EJS_CONDITIONAL_BLOCK_OPEN}${module.exports.DEFAULT_EJS_CLOSE_DELIMITER}`;
module.exports.EJS_CLOSING_IF_BLOCK_TAG = `${module.exports.DEFAULT_EJS_OPEN_DELIMITER}${module.exports.EJS_CONDITIONAL_BLOCK_END}${module.exports.DEFAULT_EJS_CLOSE_DELIMITER}`;
module.exports.CUSTOM_OPENING_IF_BLOCK_PREFIX = `${module.exports.CUSTOM_OPEN_DELIMITER}IF${module.exports.LOGICAL_CONDITION_DELIMITER}`;
module.exports.CUSTOM_OPENING_ELSEIF_BLOCK_PREFIX = `${module.exports.CUSTOM_OPEN_DELIMITER}ELSEIF${module.exports.LOGICAL_CONDITION_DELIMITER}`;
module.exports.CUSTOM_ELSE_BLOCK_TAG = `${module.exports.CUSTOM_OPEN_DELIMITER}ELSE${module.exports.CUSTOM_CLOSE_DELIMITER}`;