const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    completed: {type: Boolean, default: false},
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
});
const Project = mongoose.model('Project', projectSchema);
module.exports = Project;