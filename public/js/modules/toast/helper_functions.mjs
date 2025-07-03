/**
 * Return the first 17 characters of a UUID as a string
 */
function generateUniqueID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 17);
}

function isString(value) {
    try {
        return "".toString.call(value)===String(value)
    }
    catch(e) {// not a string
        return false
    }
}

export { generateUniqueID, isString };