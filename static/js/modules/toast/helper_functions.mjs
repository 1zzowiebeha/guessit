/**
 * Return the first 12 characters of a UUID as a string
 */
function generateUniqueID() {
    const uid = crypto.randomUUID();
    
    return uid.slice(0, 12);
}

export { generateUniqueID }