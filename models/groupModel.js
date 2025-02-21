const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    
    creator_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name:{
        type: String,
        required: true
    },
    image:{
        type: String,
        default: 'images/groupPFP.png'
    },
    limit:{
        type: Number,
        required: true,
        default: 100
    }
},
 { timestamps: true}
)

module.exports = mongoose.model('Group', groupSchema);