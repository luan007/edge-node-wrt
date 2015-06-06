declare function UUID(): NodeBuffer;
declare function UUIDstr(short?): string;
declare function randombuf(len?): NodeBuffer;
declare function randomstr(len?, encoding?): string;
declare function sha1(content): string;
declare function sha256(content): string;
declare function digest(content, key, rotation?): string;
declare function hash(passkey: string, salt: string, callback: Callback);
declare function generateToken();
declare function generateSalt();
declare function sha256_Obj(obj: any, skip_key?: KVSet);

declare function RSA_Verify(keyname, sig, data): boolean;
declare function Unsafe_SyncRSAEncrypt_Fast(keyname, content): Buffer;
declare function Safe_SyncRSAEncrypt_Fast(keyname, content, cb: PCallback<Buffer>);
declare function DecryptAESPassword(keyname, encrypted);
declare function HashDir(dir, salt);
declare function _SIGN_APP(dir);