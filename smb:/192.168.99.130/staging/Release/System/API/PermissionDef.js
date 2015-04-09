var Permission;
(function (Permission) {
    Permission[Permission["System"] = 0] = "System";
    Permission[Permission["Proxy"] = 1] = "Proxy";
    Permission[Permission["Event"] = 2] = "Event";
    Permission[Permission["IO"] = 3] = "IO";
    Permission[Permission["DeviceAccess"] = 4] = "DeviceAccess";
    Permission[Permission["UserAccess"] = 5] = "UserAccess";
    Permission[Permission["Sensor"] = 6] = "Sensor";
    Permission[Permission["AnyApp"] = 7] = "AnyApp";
    Permission[Permission["AppCrossTalk"] = 8] = "AppCrossTalk";
    Permission[Permission["AppPreLaunch"] = 9] = "AppPreLaunch";
    Permission[Permission["PortExposure"] = 10] = "PortExposure";
    Permission[Permission["Network"] = 11] = "Network";
    Permission[Permission["Configuration"] = 12] = "Configuration";
    Permission[Permission["Launcher"] = 13] = "Launcher";
    Permission[Permission["Driver"] = 14] = "Driver";
})(Permission || (Permission = {}));
global.Permission = Permission;
