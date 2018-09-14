docker build \
    -t registry.vit.tube:5000/test-vit-react:latest \
    -f Dockerfile \
    --no-cache \
    --build-arg DMCA_USER_ENDPOINT=/blank \
    --build-arg DMCA_CONTENT_ENDPOINT=/blank \
    --build-arg LIQUID_TOKEN=WIT \
    --build-arg AVATAR_PROXY=https://media.proto.vit.tube/resize/ \
    --build-arg AVATAR_UPLOAD_ENDPOINT=https://media.proto.vit.tube/upload/image \
    --build-arg AVATAR_UPLOAD_PREFIX=https://media.proto.vit.tube/view/ \
    --build-arg VIDEO_THUMBNAIL_URL_PREFIX=https://media.proto.vit.tube/playback/ \
    --build-arg VIDEO_UPLOAD_ENDPOINT=https://media.proto.vit.tube/upload/video \
    --build-arg IMAGE_UPLOAD_ENDPOINT=https://media.proto.vit.tube/upload/image \
    --build-arg VIDEO_HISTORY_ENDPOINT=https://media.proto.vit.tube/history \
    --build-arg VIDEO_UPLOAD_POSTED_ENDPOINT=https://media.proto.vit.tube/upload/video/posted/ \
    .
