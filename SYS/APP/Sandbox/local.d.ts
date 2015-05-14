
declare module local {
    export module Sandbox {
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