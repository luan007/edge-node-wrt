export function TwoDigitalize(number) {
    return (number < 10 ? '0' + number.toString() : number.toString());
}

export function NumericDate(date) {
    var str = date.getFullYear() + TwoDigitalize(date.getMonth() + 1) + TwoDigitalize(date.getDate());
    return Number(str);
}

export function NumericDateTime(date) {
    var str = date.getFullYear() + TwoDigitalize(date.getMonth() + 1) + TwoDigitalize(date.getDate())
        + TwoDigitalize(date.getHours()) + TwoDigitalize(date.getMinutes());
    return Number(str);
}

export function GetNowDateTimeString() {
    return GetDateTimeString(new Date());
}

export function GetDateTimeString(date) {
    var str = date.getFullYear() + '/' + TwoDigitalize(date.getMonth() + 1) + '/' + TwoDigitalize(date.getDate())
            + ' ' + TwoDigitalize(date.getHours()) + ':' + TwoDigitalize(date.getMinutes());
    return str;
}

export function StartsWith(str, part){
    return new RegExp("^" + part, "gmi").test(str);
}