<?php

namespace App\Actions\UserPost;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Image;
use Illuminate\Support\Facades\Storage;

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

                Image::fromUpload($file)
                    ->scale(1440)
                    ->toJpg()
                    ->storeAs(path: 'media', name: $image, disk: 'r2', options: [
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
