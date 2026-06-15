// Path: d:\DaiHoc\CongCuPhanMemMoi\tour-booking-system\backend\test-cloudinary.js
import "dotenv/config";
import cloudinary from "./src/config/cloudinary";

async function testCloudinary() {
    try {
        console.log("Cloudinary Config:", {
            cloud_name: cloudinary.config().cloud_name,
            api_key: cloudinary.config().api_key ? "PRESENT" : "MISSING"
        });
        
        // Upload a 1-pixel dummy GIF buffer
        const dummyGifBuffer = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
        
        console.log("Uploading dummy image...");
        const uploadToCloudinary = (fileBuffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "Home/Images/tours/test",
                        public_id: "test_image",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const url = await uploadToCloudinary(dummyGifBuffer);
        console.log("Uploaded successfully! URL:", url);
    } catch (err) {
        console.error("Cloudinary Upload Error:", err);
    }
}

testCloudinary();
