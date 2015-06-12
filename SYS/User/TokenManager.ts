export interface Token {
    token_uid: string;
    atoken: string;
    expire:number;
}

/**
 * atoken < == > token_uid
 */
export var TokenUUIDMap:IDic<string> = {};
/**
 * token_uid < == > Token
 */
export var TokenMap:IDic<Token> = {};
export var TokenArray:Array<Token> = [];

/**
 * Issue a token
 * @param atoken
 * @returns {any}
 */
export function Issue(atoken:string):string {
    var now = Date.now();
    var index = __binarySearch(now);
    __clear(index);

    var token = {
        token_uid: UUIDstr(),
        expire: now + CONF.TOKEN_EXPIRE_SECONDS,
        atoken: atoken
    };
    TokenArray.unshift(token);
    TokenMap[token.token_uid] = token;
    TokenUUIDMap[atoken] = token.token_uid;
    return token.token_uid;
}

/**
 * Get atoken
 * @param token_uid
 */
export function GetUserToken(token_uid):string {
    return TokenMap[token_uid].atoken;
}

/**
 * Verify a token
 * @param token_uid
 * @returns {boolean}
 */
export function Verify(token_uid): boolean {
    var now = Date.now();
    var index = __binarySearch(now);
    __clear(index);

    if (has(TokenMap, token_uid)) {
        return TokenMap[token_uid].expire >= now;
    }

    return false;
}

function __clear(index) {
    var deleted = TokenArray.splice(index);
    for (var i = 0, len = deleted.length; i < len; i++) {
        var token = TokenMap[deleted[i].token_uid];
        delete TokenUUIDMap[token.atoken];
        delete TokenMap[token.token_uid];
    }
    deleted.length = 0;
}

function __binarySearch(now) {
    var startIndex = 0,
        stopIndex = TokenArray.length - 1,
        middle = Math.floor((stopIndex + startIndex) / 2);

    while (TokenArray[middle].expire != now && startIndex < stopIndex) {
        if (now < TokenArray[middle].expire) {
            startIndex = middle + 1;
        } else if (now > TokenArray[middle].expire) {
            stopIndex = middle;
        }
        if (stopIndex === startIndex)
            return stopIndex;
        middle = Math.floor((stopIndex + startIndex) / 2);
    }

    return (TokenArray[middle].expire != now) ? -1 : middle;
}