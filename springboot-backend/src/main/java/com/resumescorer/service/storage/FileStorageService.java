package com.resumescorer.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

/**
 * Handles resume file upload/delete on AWS S3.
 * Files are stored under: resumes/{userId}/{uuid}-{originalFileName}
 */
@Slf4j
@Service
public class FileStorageService {

    @Value("${app.aws.s3.bucket}")
    private String bucket;

    private final S3Client s3;

    public FileStorageService(S3Client s3) {
        this.s3 = s3;
    }

    /**
     * Upload a resume file to S3.
     *
     * @return The S3 object key (stored in the resumes table)
     */
    public String upload(UUID userId, MultipartFile file) {
        String key = "resumes/" + userId + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        try {
            PutObjectRequest req = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3.putObject(req, RequestBody.fromBytes(file.getBytes()));
            log.info("Uploaded resume to S3: {}", key);
            return key;
        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from S3 by its key.
     */
    public void delete(String key) {
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
        log.info("Deleted from S3: {}", key);
    }
}
