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
    Launcher
    /* [ONLY] ADD BELOW */
}

global.Permission = Permission;
