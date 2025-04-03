const AWS = require("aws-sdk");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});


const uploadImage = async (file) => {
    try {
        if (!file || !file.path || !file.originalFilename) {
            throw new Error('File data is incomplete');
        }

        const fileContent = fs.readFileSync(file.path);

        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME, // Bucket name from environment variables
            Key: `uploads/${uuidv4()}_${file.originalFilename}`, // File key for S3 (file path within the bucket)
            Body: fileContent, // File content to upload
            ContentType: file.mimetype, // MIME type of the file
            ACL: "public-read", // Set file permissions (public-read allows anyone to view the file)
        };

        const s3Upload = await s3.upload(s3Params).promise();

        fs.unlinkSync(file.path);

        return { success: true, url: s3Upload.Location };
    } catch (error) {
        return { success: false, path: `/uploads/${file.filename}` };
    }
};

module.exports = {
    uploadImage
};
