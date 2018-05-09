module.exports = {
    PersonalizationTypesPrefixes : ["EVENT", "TRANS"],
    PersonalizationTagsPrefixes : ["TITLE_CASE", "LOWER", "UPPER"],
    /*
    Not sure about (are they prefixes \ suffixes \ bith...?):
    [%CURRENT_TIME:TIME_FORMAT%]
[%CURRENT_DATE:DATE_FORMAT%]
[%TOMORROW_DATE:DATE_FORMAT%]
(Can be found in the personaliztionTags table)
    * */

    GetAllPrefixes : "",
};
var allPrefixesNoDuplicates = null;
module.exports.GetAllPrefixes = function()
{
  if(allPrefixesNoDuplicates == null){
      var allPrefixes = [...module.exports.PersonalizationTypesPrefixes, ...module.exports.PersonalizationTagsPrefixes];
      allPrefixesNoDuplicates = allPrefixes.filter(function(prefix, pos){
          return allPrefixes.indexOf(prefix) == pos;
      });
  }
  return allPrefixesNoDuplicates;
};
