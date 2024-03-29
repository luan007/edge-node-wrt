﻿
// [0] ENV Extraction
//  |
//  +----------+---- target_cwd: path of the executable (parent)
//             |---- rt_id: runtime id of the application
//             |---- ui_sock: socket for main ui
//             |---- api_sock: socket for rpc
//             |---- api_json: skeleton for API reconstruction
//             |---- app_sig: signiture of this app (generated from cloud server)
//             |---- app_struct: optional, reserved
//             +---- opts


declare module local {
    export module App {

        export interface Init_Env {
            target_dir: string;
            runtime_id: string;
            ui_socket_path: string;
            api_socket_path: string;
            api_obj: any;
            api_salt: string;
            options: any;
            main_socket;
            webex_socket;
        }

        export interface RuntimeStatus {
            Heartbeat?: {
                Sent: number;
                DeltaT: number;
            };
            State: number;
            PlannedLaunchTime: number;
            LaunchTime: number;
            FailHistory?: {
                LaunchTime: number;
                ExitTime: number;
                Reason: any;
                Error?: any;
            }[];
            StabilityRating: number;
            
        }


        export interface ApplicationManifest {
            name: string;
            permission: number[];
            drivers: IDic<{
                Buses: string[];
                Interest: IDriverInterest;
            }>;
        }

    }
}