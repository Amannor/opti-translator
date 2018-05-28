module.exports = {
  PersonalizationTypesPrefixes: ['EVENT', 'TRANS'],
  PersonalizationTagsPrefixes: ['TITLE_CASE', 'LOWER', 'UPPER'],
  GetAllNonDatetimePrefixes: '',

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
