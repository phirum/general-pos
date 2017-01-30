export const exchangeCoefficient = function ({exchange, fieldToCalculate}) {
    let coefficient = {
        khr: {},
        thb: {},
        usd: {}
    };
    if (exchange.base == 'USD') {
        coefficient.khr.$multiply = [fieldToCalculate, exchange.rates.KHR];
        coefficient.thb.$multiply = [fieldToCalculate, exchange.rates.THB];
        coefficient.usd.$multiply = [fieldToCalculate, 1];
    } else if (exchange.base == 'THB') {
        coefficient.khr.$multiply = [fieldToCalculate, exchange.rates.KHR];
        coefficient.usd.$divide = [fieldToCalculate, exchange.rates.USD];
        coefficient.thb.$multiply = [fieldToCalculate, 1];
    } else {
        coefficient.thb.$divide = [fieldToCalculate, exchange.rates.THB];
        coefficient.usd.$divide = [fieldToCalculate, exchange.rates.USD];
        coefficient.khr.$multiply = [fieldToCalculate, 1];
    }
    return coefficient;
};