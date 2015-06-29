
declare module local {
    export module sandbox {
        export interface SandboxEnvironment {
            Drivers: {
                match   :   Function;
                change  :   Function;
                attach  :   Function;
                detach  :   Function;
            }[];
            
        }
    }
}