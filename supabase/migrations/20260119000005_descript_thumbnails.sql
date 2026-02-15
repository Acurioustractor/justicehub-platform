-- Add Descript video thumbnails
-- Created: January 19, 2026
-- Purpose: Set thumbnail_url for Descript videos and update platform to 'descript'

-- Update Descript videos with proper thumbnails and platform
UPDATE partner_videos
SET
  thumbnail_url = 'https://d1d3n03t5zntha.cloudfront.net/c3fc397b-1f68-4012-87c5-fd25f7bd325a/media_stream-1ddc60c28f414889b63fad601bc310f3.jpg',
  platform = 'descript'
WHERE video_url = 'https://share.descript.com/view/oaRpFZmFnIZ';

UPDATE partner_videos
SET
  thumbnail_url = 'https://d1d3n03t5zntha.cloudfront.net/yP3pzzo4JLU/media_stream-10d17415387645e0b2a28f5d76318780.png',
  platform = 'descript'
WHERE video_url = 'https://share.descript.com/view/yP3pzzo4JLU';

UPDATE partner_videos
SET
  thumbnail_url = 'https://d1d3n03t5zntha.cloudfront.net/0699b549-4907-4b9c-9555-0e81458ab06b/media_stream-91b72eb947714de193676fed2a163b79.jpg',
  platform = 'descript'
WHERE video_url = 'https://share.descript.com/view/47YVpVof6nN';

UPDATE partner_videos
SET
  thumbnail_url = 'https://d1d3n03t5zntha.cloudfront.net/f5a3b28e-d1da-4713-ba02-6f1baf266e56/media_stream-bfffa46436924b2f8dfe1a64e8a7b27e.jpg',
  platform = 'descript'
WHERE video_url = 'https://share.descript.com/view/SXnp9h3DyDQ';

UPDATE partner_videos
SET
  thumbnail_url = 'https://d1d3n03t5zntha.cloudfront.net/8d343536-dafe-465b-8f1f-c4ad3cc67de1/media_stream-bf99262645454f89b5465ef9dbaf6344.jpg',
  platform = 'descript'
WHERE video_url = 'https://share.descript.com/view/FJZqnFWOM8U';
