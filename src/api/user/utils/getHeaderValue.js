
function getHeaderValue(req, headerName) {
    if (!req || !headerName) return null;
    return req.headers[headerName.toLowerCase()] || null;
}

module.exports = getHeaderValue;
