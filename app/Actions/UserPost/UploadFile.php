<?php

namespace App\Actions\UserPost;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class UploadFile
{
    public function handle(?UploadedFile $file): string
    {
        if (! $file) {
            return '';
        }

        switch (strtolower((string) $file->extension())) {
            case 'jpg':
            case 'jpeg':
                $image = pathinfo($file->hashName(), PATHINFO_FILENAME).'.jpg';

                $encodedImage = Image::decode($file)
                    ->scaleDown(1440)->encodeUsingFileExtension('jpg');

                Storage::disk('r2')->put('media/'.$image, (string) $encodedImage, [
                    'visibility' => 'public',
                    'ContentType' => 'image/jpeg',
                    'CacheControl' => 'public, max-age=31536000',
                ]);
                return '/media/'.$image;
            case 'mp4':
                $video = pathinfo($file->hashName(), PATHINFO_FILENAME).'.mp4';

                Storage::disk('r2')->put('media/', $file, [
                    'visibility' => 'public',
                    'ContentType' => 'video/mp4',
                    'CacheControl' => 'public, max-age=31536000',
                ]);

                return '/media/'.$video;
            case 'mov':
            case 'qt':
                $video = pathinfo($file->hashName(), PATHINFO_FILENAME).'.mov';

                Storage::disk('r2')->put('media/', $file, [
                    'visibility' => 'public',
                    'ContentType' => 'video/quicktime',
                    'CacheControl' => 'public, max-age=31536000',
                ]);
                return '/media/'.$video;
            default:
                return '';
        }

    }
}
