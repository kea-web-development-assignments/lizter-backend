import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * @param {{
 *  region?: string,
 *  endpoint: string,
 *  accessKey: string,
 *  secretKey: string,
 *  bucket: string,
 *  cdn: string,
 * }} config
 */
export default async function(config) {
    const s3 = new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
        },
        forcePathStyle: true,
    });

    return {
        saveImages: (path, images) => saveImages(s3, config.bucket, config.cdn, path, images),
        deleteImages: (imageUrls) => deleteImages(s3, config.bucket, config.cdn, imageUrls),
        updateImages: (path, newImages, oldImageUrls) => updateImages(s3, config.bucket, config.cdn, path, newImages, oldImageUrls),
    }
}

async function saveImages(s3, bucket, cdn, path, images) {
    if(!path || images?.length === 0) {
        return [];
    }

    const imageUrls = [];
    const uploadCommands = [];
    for (let index = 0; index < images.length; index++) {
        const image = images[index];
        const fileExtension = image.mimetype.split('/')[1];
        const filePath = `${path}/${index + 1}.${fileExtension}`;

        const uploadCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: filePath,
            Body: image.buffer,
            ACL: "public-read",
        });
        uploadCommands.push(s3.send(uploadCommand));
        imageUrls.push(`${cdn}/${bucket}/${filePath}`);
    }

    try {
        await Promise.all(uploadCommands);
    } catch (error) {
        console.error("Failed to upload images", error);

        throw {
            status: 500,
            message: 'Failed to upload images',
        };
    }

    return imageUrls;
}

async function deleteImages(s3, bucket, cdn, imageUrls) {
    imageUrls = imageUrls?.filter((imageUrl) => imageUrl.startsWith(cdn));

    if(imageUrls.length === 0) {
        return;
    }

    try {
        const deleteCommands = imageUrls.map((imageUrl) => {
            return s3.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key:  (new URL(imageUrl)).pathname.slice(`/${bucket}/`.length),
            }));
        });

        await Promise.all(deleteCommands);
    } catch(error) {
        console.error("Failed to delete images", error);

        throw {
            status: 500,
            message: 'Failed to delete images',
        };
    }
}

async function updateImages(s3, bucket, cdn, path, newImages, oldImageUrls) {
    try {
        await deleteImages(s3, bucket, cdn, oldImageUrls);

        return await saveImages(s3, bucket, cdn, path, newImages);
    } catch(error) {
        console.error("Failed to upload images", error);

        throw {
            status: 500,
            message: 'Failed to upload images',
        };
    }
}
