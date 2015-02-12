declare function RSA_Verify(keyname, sig, data): boolean;

declare function Unsafe_SyncRSAEncrypt_Fast(keyname, content): Buffer;

declare function Safe_SyncRSAEncrypt_Fast(keyname, content, cb: PCallback<Buffer>);

declare function HashDir(dir, salt);