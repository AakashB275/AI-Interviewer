import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    userName : {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password : {
        type: String,
        required: true,
        minlength: 6
    },
    contact : {
        type: String, // Changed to String for international support
        required: true
    },
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

export default mongoose.model("user", userSchema);