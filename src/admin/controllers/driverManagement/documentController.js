const documentPage = (req, res) => {
    res.render('pages/driverManagement/document');
};


const Document = require('../../models/driverManagement/documentModel'); // Ensure this path is correct

const { generateLogs } = require('../../utils/logsHelper');

const saveDocument = async (req, res) => {
    try {
        const { name, isMandatory, isUnique, uniqueType } = req.body;

        // Check for missing fields
        if (name === undefined || isMandatory === undefined || isUnique === undefined || uniqueType === undefined) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const newDocument = new Document({ name, isMandatory, isUnique, uniqueType });
        await newDocument.save();
        await generateLogs(req, 'Add', newDocument);

        res.json({ success: true, message: 'Document added successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// Update Document
const updateDocument = async (req, res) => {
    try {
        const { name, isMandatory, isUnique, uniqueType } = req.body;
        const updatedDocument = await Document.findByIdAndUpdate(req.params.id, { name, isMandatory, isUnique, uniqueType }, { new: true });
        if (!updatedDocument) return res.status(404).json({ success: false, message: 'Document not found' });

        await generateLogs(req, 'Edit', updatedDocument);

        res.json({ success: true, message: 'Document updated successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating document' });
    }
}

const getSingleDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
        res.json(document);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching document' });
    }
}


// Read Documents (for DataTable)
const documentList = async (req, res) => {
    try {
        const documents = await Document.find().sort({ createdAt: -1 });
        res.json({ data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
}

// Delete Document
const deleteDocument = async (req, res) => {
    try {
        await Document.findByIdAndDelete(req.params.id);
        await generateLogs(req, 'delete', { id: req.params.id });

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document' });
    }
}

module.exports = { documentPage, saveDocument, documentList, deleteDocument, getSingleDocument, updateDocument }