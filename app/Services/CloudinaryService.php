<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                'api_key' => env('CLOUDINARY_API_KEY'),
                'api_secret' => env('CLOUDINARY_API_SECRET'),
            ],
            'url' => [
                'secure' => env('CLOUDINARY_SECURE', true),
            ],
        ]);
    }

    /**
     * Get Cloudinary instance
     */
    public function getCloudinary()
    {
        return $this->cloudinary;
    }

    /**
     * Upload a file to Cloudinary
     */
    public function upload($filePath, $options = [])
    {
        try {
            $defaultOptions = [
                'folder' => 'reports_attachments',
                'resource_type' => 'auto',
                'quality' => 'auto',
                'fetch_format' => 'auto'
            ];

            $uploadOptions = array_merge($defaultOptions, $options);

            $result = $this->cloudinary->uploadApi()->upload($filePath, $uploadOptions);

            return [
                'success' => true,
                'url' => $result['secure_url'],
                'public_id' => $result['public_id'],
                'format' => $result['format'],
                'size' => $result['bytes']
            ];
        } catch (\Exception $e) {
            Log::error('Cloudinary upload error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Upload multiple files
     */
    public function uploadMultiple($files, $options = [])
    {
        $results = [];
        foreach ($files as $file) {
            $results[] = $this->upload($file, $options);
        }
        return $results;
    }

    /**
     * Get optimized image URL with transformations
     */
    public function getOptimizedUrl($publicId, $options = [])
    {
        $defaults = [
            'quality' => 'auto',
            'fetch_format' => 'auto',
            'width' => 800,
            'crop' => 'limit'
        ];

        $transformation = array_merge($defaults, $options);

        return $this->cloudinary->image($publicId)->withOptions($transformation)->toUrl();
    }

    /**
     * Get thumbnail URL
     */
    public function getThumbnailUrl($publicId)
    {
        return $this->cloudinary->image($publicId)->withOptions([
            'width' => 150,
            'height' => 150,
            'crop' => 'thumb',
            'quality' => 60,
        ])->toUrl();
    }

    /**
     * Get multiple sizes for a public ID
     */
    public function getAllSizes($publicId)
    {
        return [
            'original' => $this->cloudinary->image($publicId)->toUrl(),
            'thumbnail' => $this->getThumbnailUrl($publicId),
            'medium' => $this->getOptimizedUrl($publicId, ['width' => 500, 'height' => 500]),
            'large' => $this->getOptimizedUrl($publicId, ['width' => 1200, 'height' => 1200]),
        ];
    }

    /**
     * Delete an image from Cloudinary
     */
    public function deleteImage($publicId)
    {
        try {
            \Log::info('Attempting to delete from Cloudinary', ['public_id' => $publicId]);

            $result = $this->cloudinary->uploadApi()->destroy($publicId);

            \Log::info('Cloudinary delete result', ['result' => $result]);

            // Cloudinary returns 'ok' or 'not found' etc.
            return $result['result'] === 'ok';

        } catch (\Exception $e) {
            \Log::error('Cloudinary delete failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get signature for unsigned upload (for mobile app)
     */
    public function getUploadSignature($folder = 'reports_attachments')
    {
        $timestamp = time();
        $uploadPreset = 'case_report_preset'; // Create this in Cloudinary dashboard

        $signature = $this->cloudinary->uploadApi()->signUpload([
            'timestamp' => $timestamp,
            'folder' => $folder,
            'upload_preset' => $uploadPreset
        ]);

        return [
            'timestamp' => $timestamp,
            'signature' => $signature,
            'upload_preset' => $uploadPreset,
            'cloud_name' => env('CLOUDINARY_CLOUD_NAME')
        ];
    }
}
