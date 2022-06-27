const { uniqueNamesGenerator, colors, animals } = require('unique-names-generator');

const randomName = () => 'Anon ' + uniqueNamesGenerator({ dictionaries: [colors, animals], style: 'capital', separator: " "});

exports.randomName = randomName;