enum Permission {
    System,
    Proxy,
    Event,
    IO,
    DeviceAccess,
    UserAccess,
    Sensor,
    AnyApp,
    AppCrossTalk,
    AppPreLaunch,
    PortExposure,
    Network,
    Configuration,
    Launcher,
    Driver
    /* [ONLY] ADD BELOW */
}

global.Permission = Permission;
