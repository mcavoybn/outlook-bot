
const vulgarities = require('./vulgarities').vulgarities.trim();

const builtins = [
  { 
    label: 'Phone Number',
    type: 'regex',
    pattern: String.raw`^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$`,
    iflag: false,
    dflag: false
  }, { 
    label: 'Email Address',
    type: 'regex',
    pattern: String.raw`[a-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?`,
    iflag: true,
    dflag: false
  }, { 
    label: 'Credit Card',
    type: 'regex',
    pattern: String.raw`(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})`,
    iflag: false,
    dflag: true
  }, { 
    label: 'English Guarantee',
    type: 'terms',
    pattern: 'guarantee\nguaranty\nwarrant\nwarranty\ncontract\npromise\nassure\ncertify\nswear\ntestify\nendorse\nreassure',
    iflag: true,
    dflag: false
  }, { 
    label: 'English Vulgarity',
    type: 'terms',
    pattern: vulgarities,
    iflag: true,
    dflag: false
  }
];

module.exports = {
    builtins,
};
