const consts = require('./consts.js');

module.exports = {
  PersonalizationTypesPrefixes: ['EVENT', 'TRANS'],
  PersonalizationTagsPrefixes: ['TITLE_CASE', 'LOWER', 'UPPER'],
  GetAllNonDatetimePrefixes: '',
  timeFormats:
    [
      'HH', // 24-hour: 23-34
      'hh', // 12-hour: 11-34
      'mm', // Minutes: 00:27
      'tt', // Lower case am/pm
      'TT', // Upper case AM/PM
    ],
  DefaultTimeFormat: '',
  dateFormats:
    [
      'yyyy', // Year: 2014
      'dd', // Day in digits: 31 (deduced from 01-31)
      'dddd', // Full day name: Saturday
      'MM', // Month in digits: 11
      'MMM', // Month name, first 3 letters, title case: Jan
      'MMMM', // Full month name: February
    ],
  DefaultDateFormat: '',
  GetAllDateTimeFormats: '',
};
let allPrefixesNoDuplicates = null;
module.exports.GetAllNonDatetimePrefixes = function () {
  if (allPrefixesNoDuplicates == null) {
    const allPrefixes = [...module.exports.PersonalizationTypesPrefixes,
      ...module.exports.PersonalizationTagsPrefixes];
    allPrefixesNoDuplicates = allPrefixes.filter((prefix, pos) => allPrefixes.indexOf(prefix)
      === pos);
  }
  return allPrefixesNoDuplicates;
};
module.exports.DefaultTimeFormat = `${module.exports.timeFormats.LH}${consts.CUSTOM_CLOSE_DELIMITER}${module.exports.timeFormats.MM} ${module.exports.timeFormats.UT}`; // see PBI#11163
module.exports.DefaultDateFormat = `${module.exports.dateFormats.YY}-${module.exports.dateFormats.SM}-${module.exports.dateFormats.SD}`; // see PBI#11163
let allDateTimeFormats = null;
module.exports.GetAllDateTimeFormats = function () {
  if (allDateTimeFormats == null) {
    const allFormats = [...module.exports.timeFormats, ...module.exports.dateFormats];
    allDateTimeFormats = allFormats.filter((prefix, pos) => allFormats.indexOf(prefix)
      === pos);
  }
  return allDateTimeFormats;
};
