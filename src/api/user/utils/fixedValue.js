const toFixed = (val) => {
    const num = parseFloat(val);
    const typeCastNumber = isNaN(num) ? "0.00" : num.toFixed(2); // <- this is string
    console.log(typeof (typeCastNumber), ' -> ', typeCastNumber);
    return (typeCastNumber); // <- returns string
};

module.exports = { toFixed };
