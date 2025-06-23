const toFixed = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toFixed(2); // returns string like "4567.00"
};

module.exports = { toFixed };
