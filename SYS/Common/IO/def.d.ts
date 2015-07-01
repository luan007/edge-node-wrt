declare var FIFO :{
    Link: (source_id, target_id, cb) => any;
    DeploySource: (owner, path, cb) => any;
    DeployTarget: (owner, path, cb) => any;
    QueryStream: (owner, name, type) => any;
    ReadFrom: (owner, name)=>any;
    WriteTo: (owner, name)=>any;
    Release : (name) => any;
    ReleaseByOwner :(owner)  => any;
    all: IDic<{
        hoststream: any,
        path: string,
        link: string,
        type: number,
        owner: string
    }>;
};

