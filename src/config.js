// API 
export const API_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "https://peer.proto.vit.tube/"
export const API_ADDRESS_PREFIX = process.env.REACT_APP_API_ADDRESS_PREFIX ? process.env.REACT_APP_API_ADDRESS_PREFIX : "WIT"
export const API_CHAIN_ID = process.env.REACT_APP_API_CHAIN_ID ? process.env.REACT_APP_API_CHAIN_ID : "1d50f6bcf387a5af6ebac42146ef920aedb5cc61d8f8ed37fb1ac671d722a302"

// number of items to be loaded per page
// should be multiplied by 4 because the layout puts 4 video in a row
export const PAGESIZE_HOMEPAGE = 28;
export const PAGESIZE_TAG = 28;
export const PAGESIZE_CHANNEL = 28;

export const AVATAR_PROXY = process.env.REACT_APP_AVATAR_PROXY ? process.env.REACT_APP_AVATAR_PROXY : "https://media.vit.tube/resize/";
export const AVATAR_DEFAULT = 'https://proto.touchit.social/images/user.png';
export const AVATAR_SIZE_SMALL = 64;
export const AVATAR_SIZE_MEDIUM = 100;

//export const AVATAR_UPLOAD_ENDPOINT = process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT ? process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT : "http://138.197.166.131:5000"
export const AVATAR_UPLOAD_ENDPOINT = process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT ? process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT : "https://media.vit.tube/upload/image"
export const AVATAR_UPLOAD_PREFIX = process.env.REACT_APP_AVATAR_UPLOAD_PREFIX ? process.env.REACT_APP_AVATAR_UPLOAD_PREFIX : "https://media.vit.tube/view/";
export const VIDEO_THUMBNAIL_URL_PREFIX = process.env.REACT_APP_VIDEO_THUMBNAIL_URL_PREFIX ? process.env.REACT_APP_VIDEO_THUMBNAIL_URL_PREFIX : "https://media.vit.tube/playback/";
export const VIDEO_UPLOAD_ENDPOINT = process.env.REACT_APP_VIDEO_UPLOAD_ENDPOINT ? process.env.REACT_APP_VIDEO_UPLOAD_ENDPOINT : "https://media.vit.tube/upload/video";
export const IMAGE_UPLOAD_ENDPOINT = process.env.REACT_APP_IMAGE_UPLOAD_ENDPOINT ? process.env.REACT_APP_IMAGE_UPLOAD_ENDPOINT : "https://media.vit.tube/upload/image";


// DMCA endpoints
export const DMCA_CONTENT_ENDPOINT = process.env.REACT_APP_DMCA_CONTENT_ENDPOINT ? process.env.REACT_APP_DMCA_CONTENT_ENDPOINT : "http://localhost:3000/DMCAContents";
export const DMCA_USER_ENDPOINT = process.env.REACT_APP_DMCA_USER_ENDPOINT ? process.env.REACT_APP_DMCA_USER_ENDPOINT : "http://localhost:3000/DMCAUsers";
export const LIQUID_TOKEN = process.env.REACT_APP_LIQUID_TOKEN ? process.env.REACT_APP_LIQUID_TOKEN : 'VIT';
