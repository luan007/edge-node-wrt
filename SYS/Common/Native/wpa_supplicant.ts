eval(LOG("Common:Native:wpa_supplicant"));

//TODO: Implement
//

// *WPA_Ctrl_Interface* for reading CONNECTED/DISCONNECTED messages
// Perform ALL operation here
// & perform automatic reconnect if possible (or just trigger event and let sys decide what to do)
// see wpa_cli (source code)
// implement interface as hostapd's control interface, should be the same thing


/*
 Whole Process is like this

 Start WPA_SUPPLICANT with minimum config
 Start WPA_CLI

>add_network 
<0

>scan
<CTRL-EVENT-SCAN-STARTED (visible from both cli and supplicant)

<CTRL-EVENT-SCAN-RESULTS (visible from cli)

>scan_results
...lots lots of stuff
...can be parsed

>set_network 0 ssid "mimi"
<OK

>set_network 0 psk "absdfgkasdkfasdf"
<OK (or FAIL if something went wrong)

>select_network 0
<OK


..SME: Trying to authenticate with ...
...CTRL-EVENT-DISCONNECTED reason = 15 (password problem)
>disconnect

>set_network 0 psk "mimimimi"
<OK (or FAIL if something went wrong)

>select_network 0
<OK

..SME: ...

...CTRL-EVENT-CONNECTED (good)



>status

bssid=aa:bb:cc:dd:ee:ff
ssid=mimi
id=0
mode=station
par...
wpa_state=COMPLETED <--use this to determine current state
...


>reconfigure
...

*/


// *WPA_Supplicant_Config* - SHOULD NOT CONTAIN ANY INFO
// JUST
// ctrl_interface=/run/wpa_supplicant
// update_config = 1


// WPA_Supplicant (process) - stays alive from boot, should not reboot
// all job should be done inside ctrl_interface
// wpa_supplicant -i wlan0_sta -c /some.conf