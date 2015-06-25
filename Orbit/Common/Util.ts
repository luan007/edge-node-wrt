export function TwoDigitalize(number) {
    return (number < 10 ? '0' + number.toString() : number.toString());
}

export function NumericDate(date) {
    var str = date.getFullYear() + TwoDigitalize(date.getMonth() + 1) + TwoDigitalize(date.getDate());
    return Number(str);
}