const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const randomName = () => uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals], style: 'capital' });

exports.randomName = randomName;