const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userName : String,
    email: String,
    password : String,
    contact : Number,
    userTrainingData: {
        hasUploadedData: {
            type: Boolean,
            default: false
        },
        uploadedFiles: [{
            originalName: String,
            filename: String,
            path: String,
            size: Number,
            mimetype: String,
            uploadDate: {
                type: Date,
                default: Date.now
            }
        }],
        dataType: {
            type: String,
            enum: ['resume', 'job-description', 'interview-questions', 'general'],
            default: 'general'
        },
        description: String,
        lastUpdated: {
            type: Date,
            default: Date.now
        },
    }
})

module.exports = mongoose.model("user", userSchema);