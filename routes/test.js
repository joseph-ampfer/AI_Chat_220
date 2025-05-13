const validator = require('validator');

// Helper
function normalizeEmail(email) {
    return validator.normalizeEmail(email, {
        gmail_lowercase: true,
        gmail_remove_dots: true,
        gmail_remove_subaddress: true,
        gmail_convert_googlemaildotcom: true,
        outlookdotcom_lowercase: true,
        outlookdotcom_remove_subaddress: true,
        yahoo_lowercase: true,
        yahoo_remove_subaddress: true,
        icloud_lowercase: true,
        icloud_remove_subaddress: true
    });
}

console.log(normalizeEmail('ja.mpfer+test1@gmail.com'));