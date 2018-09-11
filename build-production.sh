docker build \
    -t registry.vit.tube:5000/production-vit-react:latest \
    -f Dockerfile \
    --build-arg DMCA_USER_ENDPOINT=/blank \
    --build-arg DMCA_CONTENT_ENDPOINT=/blank \
    --build-arg LIQUID_TOKEN=VIT \
    --build-arg APP_API_URL=https://peer.vit.tube \
    --build-arg APP_API_ADDRESS_PREFIX=VIT \
    --build-arg APP_API_CHAIN_ID=73f14dd4b7b07a8663be9d84300de0f65ef2ee7e27aae32bbe911c548c08f000 \
    --build-arg AVATAR_PROXY=https://media.vit.tube/resize/ \
    --build-arg AVATAR_UPLOAD_ENDPOINT=https://media.vit.tube/upload/image \
    --build-arg AVATAR_UPLOAD_PREFIX=https://media.vit.tube/view/ \
    --build-arg VIDEO_THUMBNAIL_URL_PREFIX=https://media.vit.tube/playback/ \
    --build-arg VIDEO_UPLOAD_ENDPOINT=https://media.vit.tube/upload/video \
    --build-arg IMAGE_UPLOAD_ENDPOINT=https://media.vit.tube/upload/image \
    --build-arg VIDEO_HISTORY_ENDPOINT=https://media.vit.tube/history \
    --build-arg VIDEO_UPLOAD_POSTED_ENDPOINT=https://media.vit.tube/upload/video/posted/ \
    .
