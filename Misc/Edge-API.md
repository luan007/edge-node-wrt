Edge API Documentation / TBD
======================

##Invokation

During the initialization of your application sandbox:

__```global.API```__ will be added to Global scope

--------------------------

> __```global.API```__ can be viewed as an standard javascript Object which has childnodes and methods, at the same time
every node of __```global.API```__ __including itself__ acts as an __```events.EventEmitter```__.

--------------------------

Thus all API Invokations are made through calling __```global.API```__ and its childnodes.




##Basis of Design

API Functions are designed following targets

* [1] **NodeJS Style Param-Order for _both Function and Callback_**

* [2] **Guaranteed Callback** (unless specially noticied)

* [3] **Callback will be called _Only Once_** (unless specially noticied)


-----------------------------
####[1] Nodejs Style Param-Order

All functions are implemented with preset order of params:


``` javascript
API.Sample.SampleCall( access_token?, ...args?, cb )
```

|Pos|      Name        | Required   | Description |
|:-:|------------------|:----------:|-------------|
| 1 |```ACCESS_TOKEN```| `OPTIONAL` | Access Token is required when the API needs to be triggered with `UserAction`, this token is sent as [Key __TBD__] in `HTTP-HEADERS` during browser page-load. *Notice: This token has a automatic timeout which is under `10 Seconds`*.
| 2 |```... args ```   | `OPTIONAL` | Function Specific Parameters, length can vary
| 3 |```cb```          | `REQUIRED` | Callback Function ```function(err, result) ```, which will be called once the remote procedure is `finished` or `timed out`. This function must be the __LAST__ param of your function call.


-----------------------------
####[2] Guaranteed Callback

Callback is and should be guaranteed according to nodejs's programming work-flow,
this is achieved by adding timeouts to function calls.

Remote Functions has __`timeout`__ mechanisim built in, the callback will automatically be fired if it reaches the preset timeout. 
This timeout cannot be changed per-call. 


__TBD__ (LifeSpan Management of a function)

However, due to the very nature of hardware related tasks *(streaming, IO operations, etc.)*, timeout may be circumvented using special __`Heartbeat Methods`__ when the remote function is created with __```CUSTOM_TIMING```__ flag.

_Sample: Extending Timeout using heartbeat messages during a call to `API.Sample.SampleCall`_

``` javascript

// A call is made to the OS
var handle = API.Sample.SampleCall(data, cb);

// Ensures this call lives longer if not finished
setInterval(function(){
	API.ExtendCallLife(handle, function(err, result){
		if(err) return console.log('Failed to extend call-life', err);
		console.log(result);
	});
}, 1000);

``` 
__TBD__: LifeSpan Helper

Creating and releasing `setInterval` handles for such task are prone to memory leaks.

Use ```global.Helper.LifeSpan```, when needed.

_Sample: Extending Timeout using `LifeSpan Helper`_

``` javascript

// A call is made to the OS
var handle = API.Sample.SampleCall(data, cb);

// Ensures this call lives longer if not finished
Helper.LifeSpan.Keep(handle);

```

-----------------------------
####[3] Callback will be called _Only Once_

~~This one ensures your brain don't blow up during the development.~~

This one makes sure your program works in a sane way.

A tagged function is used under the hood, to ensure your callback is called, then destroyed, for __once__.
Thus you can safely assume callback works just like __`return`__, asynchronized.

*What if I want to implement something that has calls cb multiple times?*

__USE EVENTS INSTEAD__


-----------------------------

*TO BE COMPLETED*


*ACTUALLY, API PART SHOULD BE AUTOMATICALLY GENERATED USING THE DUMP TOOL*


###API

-> API.RegisterEvent

-> API.ExtendCallLife

###IO

-> API.IO.CreateFD

-> API.IO.ConnectFD

-> API.IO.CreateTunnel


###Application

-> API.Application.Quota

-> API.Application.RaiseQuota

-> API.Application.List

-> API.Application.Settings.Set

-> API.Application.Settings.Get

-> API.Application.Settings.List

-> API.Application.RegisterBlock

-> API.Application.RemoveBlock

-> API.Application.RenderBlock

###Action

-> API.Action.Query

###Edge

-> API.Edge.Info

-> API.Edge.Status

-> API.Edge.Config.Set

-> API.Edge.Config.Get

-> API.Edge.Reboot

-> API.Edge.RunDiagnostics

-> API.Edge.BLE.GATTRead

-> API.Edge.BLE.GATTWrite

-> API.Edge.BLE.GATTCommand

-> API.Edge.Wireless.PerformScan

-> API.Edge.Wireless.PerformScan

-> API.Edge.Wireless.JoinAsPeer _for go-pro and cameras, and repeator_

-> API.Edge.Wireless.UpdatePeerNetwork

-> API.Edge.SetAsUplink

###Credential

-> API.Credential.Login

-> API.Credential.Logout

###User

-> API.User.Current

-> API.User.Get

-> API.User.Query

-> API.User.Admin

-> API.User.OwnedDevices

-> API.User.LinkedData.Add

-> API.User.LinkedData.Update

-> API.User.LinkedData.Remove

-> API.User.LinkedData.Get

-> API.User.Preference.Get

-> API.User.Preference.Set

###Device

-> API.Device.ActiveUpdate

-> API.Device.CreateDevice *TBD*

-> API.Device.Current

-> API.Device.Get

-> API.Device.Query

-> API.Device.Invoke

###Messaging

-> API.Messaging.Create

-> API.Messaging.Query

-> API.Messaging.Unread

-> API.Messaging.Flag

###Audio _TBD_

-> API.Audio.GetContents _of stream_

-> API.Audio.SetContents _of stream_

-> API.Audio.CurrentPlaying _of stream_

-> API.Audio.CreateStream _Type [Raw | Managed]_

-> API.Audio.AcquireFD _of stream_

-> API.Audio.CloseStream

-> API.Audio.SendControl _to stream_

-> API.Audio.Streams

-> API.Audio.MasterControl


#####Helpers _TBD_

-> API.Device.Printer.Print

-> API.Device.Printer.Jobs

-> API.Device.Scanner.Scan

-> API.Device.Camera.RequestViewFinder

-> API.Device.Camera.Control

-> API.Device.Camera.Files

-> API.Device.GenericDeivce.OS

-> API.Device.GenericDeivce.Vendor
