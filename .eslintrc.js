module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "parserOptions":{
        "sourceType":"module"
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            "tab",
            {"SwitchCase":1}
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
    }
};