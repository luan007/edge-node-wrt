declare var FIFO :{
    Link: (source_id, target_id, cb) => any;
    Release : (name) => any;
    ReleaseByOwner :(owner)  => any;

    CreateSource : (owner, path, cb) => any;
    CreatePipedTarget :(owner, path, source, cb)  => any;

    all:any;
};

