export interface Token {
    token_uid: string;
    atoken: string;
    expire:number;
    devid: string;
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
export function Issue(atoken:string, devid: string):string {
    var now = Date.now();
    var index = __binarySearch(now);
    console.log('clear token array, total:'['cyanBG'].bold, TokenArray.length, ', expire index:', index);
    __clear(index);

    if(TokenUUIDMap[atoken])
        return TokenUUIDMap[atoken];

    var token = {
        token_uid: UUIDstr(),
        expire: Date.now() + CONF.TOKEN_EXPIRE_SECONDS,
        atoken: atoken,
        devid: devid
    };
    TokenArray.unshift(token);
    TokenMap[token.token_uid] = token;
    TokenUUIDMap[atoken] = token.token_uid;
    console.log('((( atoken', atoken, '))) ((( token_uid', token.token_uid, ')))');
    return token.token_uid;
}

/**
 * Get atoken
 * @param token_uid
 */
export function GetUserToken(token_uid):string {
    return TokenMap[token_uid].atoken;
}

export function GetCurrentDeviceId(token_uid):string{
    return TokenMap[token_uid].devid;
}

/**
 * Verify a token
 * @param token_uid
 * @returns {boolean}
 */
export function Verify(token_uid):boolean {
    var now = _patrolThread();

    if (has(TokenMap, token_uid)) {
        return TokenMap[token_uid].expire >= now;
    }

    return false;
}

function __clear(index) {
    if (index === -1)
        return;
    var deleted = TokenArray.splice(index);
    for (var i = 0, len = deleted.length; i < len; i++) {
        var token = TokenMap[deleted[i].token_uid];
        delete TokenUUIDMap[token.atoken];
        delete TokenMap[token.token_uid];
    }
    deleted.length = 0;
}

function __binarySearch(now) {
    if (TokenArray.length === 0)
        return -1;

    var startIndex = 0,
        stopIndex = TokenArray.length - 1,
        middle = Math.floor((stopIndex + startIndex) / 2);

    while (TokenArray[middle].expire != now && startIndex <= stopIndex) {
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

function _patrolThread() {
    var now = Date.now();
    var index = __binarySearch(now);
    __clear(index);
    return now;
}

export function Initialize(cb) { // Token clean-up patrol
    trace("Starting Patrol Thread - " + (CONF.TOKEN_PATROL_INTERVAL + "").bold["cyanBG"]);
    setJob("TOKEN_CLEAN", _patrolThread, CONF.TOKEN_PATROL_INTERVAL);
    cb();
}