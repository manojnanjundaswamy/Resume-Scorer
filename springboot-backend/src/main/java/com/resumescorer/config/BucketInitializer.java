package com.resumescorer.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

/**
 * Ensures the S3/MinIO bucket exists on application startup.
 * Safe to run against real AWS S3 (no-ops if bucket already exists).
 */
@Slf4j
@Configuration
public class BucketInitializer {

    @Value("${app.aws.s3.bucket}")
    private String bucketName;

    private final S3Client s3;

    public BucketInitializer(S3Client s3) {
        this.s3 = s3;
    }

    @PostConstruct
    public void ensureBucketExists() {
        try {
            s3.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket already exists: {}", bucketName);
        } catch (NoSuchBucketException e) {
            createBucket();
        } catch (Exception e) {
            // headBucket throws SdkClientException if MinIO isn't up yet —
            // try creating anyway; if it already exists the SDK won't throw.
            log.warn("Could not check bucket existence ({}), attempting create...", e.getMessage());
            createBucket();
        }
    }

    private void createBucket() {
        try {
            s3.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
            log.info("Created S3 bucket: {}", bucketName);
        } catch (BucketAlreadyOwnedByYouException | BucketAlreadyExistsException ex) {
            log.info("Bucket already exists (race condition): {}", bucketName);
        } catch (Exception ex) {
            log.error("Failed to create bucket '{}': {}", bucketName, ex.getMessage());
            // Don't crash startup — uploads will fail gracefully if bucket missing
        }
    }
}
