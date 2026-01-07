import mongoose from 'mongoose';
import config from 'config';
import debug from 'debug';

const dbgr = debug("development:mongoose");

mongoose.connect(config.get("MONGODB_URI"))
.then(function(){
    dbgr("connected");
})
.catch(function(err){
    dbgr(err);
})

export default mongoose.connection;

// set DEBUG="development:*"      used to set up environment variables