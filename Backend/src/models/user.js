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
        required: function() {
            // required only when not an OAuth user (no googleId present)
            return !(this.userTrainingData && this.userTrainingData.googleId);
        },
        minlength: 6
    },
    contact : {
        type: String, // Changed to String for international support
        required: function() {
            return !(this.userTrainingData && this.userTrainingData.googleId);
        }
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

        googleId: {
            type: String,
            sparse: true   // allows multiple null values (non-OAuth users)
        },
        avatar: {
            type: String,
            default: null
        }
    }
})

export default mongoose.model("user", userSchema);