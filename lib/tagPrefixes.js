module.exports = {
    PersonalizationTypesPrefixes: ["EVENT", "TRANS"],
    PersonalizationTagsPrefixes: ["TITLE_CASE", "LOWER", "UPPER"],
    TimeObj: {
        Prefixes: ["CURRENT_TIME"],
        formats: [
            {
                UH: "HH", //24-hour: 23-34
                LH: "hh", //12-hour: 11-34
                MM: "mm", //Minutes: 00:27
                LT: "tt", //Lower case am/pm
                UT: "TT", //Upper case AM/PM
            }]
    },
    DateObj: {
        Prefixes: ["CURRENT_DATE", "TOMORROW_DATE"],
        formats: [
            {
                YY: "yyyy", //Year: 2014
                SD: "dd", //Day in digits: 31 (deduced from 01-31)
                FD: "dddd", //Full day name: Saturday
                SM: "MM", //Month in digits: 11
                AM: "MMM", //Month name, first 3 letters, title case: Jan
                FM: "MMMM", //Full month name: February
            }]
    },
    /*
    Not sure about (are they prefixes \ suffixes \ bith...?):
    [%CURRENT_TIME:TIME_FORMAT%]
[%CURRENT_DATE:DATE_FORMAT%]
[%TOMORROW_DATE:DATE_FORMAT%]
(Can be found in the personaliztionTags table)
    * */

    GetAllNonDatetimePrefixes: "",
};
var allPrefixesNoDuplicates = null;
module.exports.GetAllNonDatetimePrefixes = function () {
    if (allPrefixesNoDuplicates == null) {
        var allPrefixes = [...module.exports.PersonalizationTypesPrefixes, ...module.exports.PersonalizationTagsPrefixes];
        allPrefixesNoDuplicates = allPrefixes.filter(function (prefix, pos) {
            return allPrefixes.indexOf(prefix) == pos;
        });
    }
    return allPrefixesNoDuplicates;
};
