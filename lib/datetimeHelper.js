module.exports = {
  TimeTags: ['CURRENT_TIME'],
  timeFormats:
      {
        H2: 'HH', // 24-hour: 23
        h2: 'hh', // 12-hour: 11
        m2: 'mm', // Minutes: 27
        s2: 'ss', // Seconds: 27
        t2: 'tt', // Lower case am/pm
        T2: 'TT', // Upper case AM/PM
      },
  DefaultTimeFormat: '',
  LegalTimeFormats: '',

  DateTags: ['CURRENT_DATE', 'TOMORROW_DATE'],
  dateFormats:
      {
        y4: 'yyyy', // Year: 2014
        d2: 'dd', // Day in digits: 31 (deduced from 01-31)
        d4: 'dddd', // Full day name: Saturday
        M2: 'MM', // Month in digits: 11
        M3: 'MMM', // Month name, first 3 letters, title case: Jan
        M4: 'MMMM', // Full month name: February
      },
  DefaultDateFormat: '',
  LegalDateFormats: '',

  DATETIME_TAGS_KEY: 'TAGS',
  DATETIME_FORMATS_KEY: 'FORMATS',
  DATETIME_DEF_FORMAT_KEY: 'DEF_FORMAT',
  DATETIME_DEF_FORMAT_ALIAS_KEY: 'DEF_FORMAT_ALIAS',
  DateTimeObjList: '',

  GetLegalDateTimeFormats: '',
};

module.exports.DefaultTimeFormat = `${module.exports.timeFormats.h2}:${module.exports.timeFormats.m2} ${module.exports.timeFormats.T2}`; // see PBI#11163
module.exports.DefaultDateFormat = `${module.exports.dateFormats.y4}-${module.exports.dateFormats.M2}-${module.exports.dateFormats.d2}`; // see PBI#11163

module.exports.LegalTimeFormats = [`${module.exports.timeFormats.H2}:${module.exports.timeFormats.m2}:${module.exports.timeFormats.s2}`,
  `${module.exports.timeFormats.h2}:${module.exports.timeFormats.m2}:${module.exports.timeFormats.s2} ${module.exports.timeFormats.t2}`,
  `${module.exports.timeFormats.h2}:${module.exports.timeFormats.m2}:${module.exports.timeFormats.s2} ${module.exports.timeFormats.T2}`,
];


module.exports.LegalDateFormats = [`${module.exports.dateFormats.y4}-${module.exports.dateFormats.M2}-${module.exports.dateFormats.d2}`,
  `${module.exports.dateFormats.d2}-${module.exports.dateFormats.M2}-${module.exports.dateFormats.y4}`,
  `${module.exports.dateFormats.M2}-${module.exports.dateFormats.d2}-${module.exports.dateFormats.y4}`,
  `${module.exports.dateFormats.y4}/${module.exports.dateFormats.M2}/${module.exports.dateFormats.d2}`,
  `${module.exports.dateFormats.M2}/${module.exports.dateFormats.d2}/${module.exports.dateFormats.y4}`,
];


let legalDateTimeFormats = null;
module.exports.GetLegalDateTimeFormats = function () {
  if (legalDateTimeFormats == null) {
    legalDateTimeFormats = [];
    module.exports.LegalDateFormats.forEach((dateFormat) => {
      module.exports.LegalTimeFormats.forEach((timeFormat) => {
        legalDateTimeFormats.push(`${dateFormat} ${timeFormat}`);
      });
    });
  }
  return legalDateTimeFormats;
};

module.exports.DateTimeObjList =
        [
          // Time Obj
          {
            [module.exports.DATETIME_TAGS_KEY]: module.exports.TimeTags,
            [module.exports.DATETIME_FORMATS_KEY]: module.exports.timeFormats,
            [module.exports.DATETIME_DEF_FORMAT_KEY]: module.exports.DefaultTimeFormat,
            [module.exports.DATETIME_DEF_FORMAT_ALIAS_KEY]: 'TIME_FORMAT',
          },

          // Date Obj
          {
            [module.exports.DATETIME_TAGS_KEY]: module.exports.DateTags,
            [module.exports.DATETIME_FORMATS_KEY]: module.exports.dateFormats,
            [module.exports.DATETIME_DEF_FORMAT_KEY]: module.exports.DefaultDateFormat,
            [module.exports.DATETIME_DEF_FORMAT_ALIAS_KEY]: 'DATE_FORMAT',
          },
        ];

