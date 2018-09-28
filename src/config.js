// API 
export const API_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "https://peer.proto.vit.tube/"
export const API_ADDRESS_PREFIX = process.env.REACT_APP_API_ADDRESS_PREFIX ? process.env.REACT_APP_API_ADDRESS_PREFIX : "WIT"
export const API_CHAIN_ID = process.env.REACT_APP_API_CHAIN_ID ? process.env.REACT_APP_API_CHAIN_ID : "1d50f6bcf387a5af6ebac42146ef920aedb5cc61d8f8ed37fb1ac671d722a302"

// number of items to be loaded per page
// should be multiplied by 4 because the layout puts 4 video in a row
export const PAGESIZE_HOMEPAGE = 28;
export const PAGESIZE_TAG = 28;
export const PAGESIZE_CHANNEL = 28;

export const AVATAR_PROXY = process.env.REACT_APP_AVATAR_PROXY ? process.env.REACT_APP_AVATAR_PROXY : "https://media.proto.vit.tube/resize/";
export const AVATAR_DEFAULT = 'https://proto.touchit.social/images/user.png';
export const AVATAR_SIZE_SMALL = 64;
export const AVATAR_SIZE_MEDIUM = 100;
export const SCREENSHOT_IMAGE = 'screenshot-01.jpg'

//export const AVATAR_UPLOAD_ENDPOINT = process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT ? process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT : "http://138.197.166.131:5000"
export const AVATAR_UPLOAD_ENDPOINT = process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT ? process.env.REACT_APP_AVATAR_UPLOAD_ENDPOINT : "https://media.proto.vit.tube/upload/image"
export const AVATAR_UPLOAD_PREFIX = process.env.REACT_APP_AVATAR_UPLOAD_PREFIX ? process.env.REACT_APP_AVATAR_UPLOAD_PREFIX : "https://media.proto.vit.tube/view/";
export const VIDEO_THUMBNAIL_URL_PREFIX = process.env.REACT_APP_VIDEO_THUMBNAIL_URL_PREFIX ? process.env.REACT_APP_VIDEO_THUMBNAIL_URL_PREFIX : "https://media.proto.vit.tube/playback/";
export const VIDEO_THUMBNAIL_LIST_SIZE = process.env.REACT_APP_VIDEO_THUMBNAIL_LIST_SIZE ? process.env.REACT_APP_VIDEO_THUMBNAIL_LIST_SIZE : '600x400'
export const VIDEO_UPLOAD_ENDPOINT = process.env.REACT_APP_VIDEO_UPLOAD_ENDPOINT ? process.env.REACT_APP_VIDEO_UPLOAD_ENDPOINT : "https://media.proto.vit.tube/upload/video";
export const VIDEO_CANCEL_ENDPOINT = process.env.REACT_APP_VIDEO_CANCEL_ENDPOINT ? process.env.REACT_APP_VIDEO_CANCEL_ENDPOINT : VIDEO_UPLOAD_ENDPOINT + "/cancel/"
export const IMAGE_UPLOAD_ENDPOINT = process.env.REACT_APP_IMAGE_UPLOAD_ENDPOINT ? process.env.REACT_APP_IMAGE_UPLOAD_ENDPOINT : "https://media.proto.vit.tube/upload/image";
export const VIDEO_HISTORY_ENDPOINT = process.env.REACT_APP_VIDEO_HISTORY_ENDPOINT ? process.env.REACT_APP_VIDEO_HISTORY_ENDPOINT : "https://media.proto.vit.tube/history";
export const VIDEO_UPLOAD_POSTED_ENDPOINT = process.env.REACT_APP_VIDEO_UPLOAD_POSTED_ENDPOINT ? process.env.REACT_APP_VIDEO_UPLOAD_POSTED_ENDPOINT : "https://media.proto.vit.tube/upload/video/posted/";

export const VIDEO_LINK_EMBEDED_CODE_PARSER = process.env.REACT_APP_VIDEO_LINK_EMBEDED_CODE_PARSER ? process.env.REACT_APP_VIDEO_LINK_EMBEDED_CODE_PARSER : "http://localhost:5000/embed?url=";

// DMCA endpoints
export const DMCA_CONTENT_ENDPOINT = process.env.REACT_APP_DMCA_CONTENT_ENDPOINT ? process.env.REACT_APP_DMCA_CONTENT_ENDPOINT : "/blank";
export const DMCA_USER_ENDPOINT = process.env.REACT_APP_DMCA_USER_ENDPOINT ? process.env.REACT_APP_DMCA_USER_ENDPOINT : "/blank";

export const LIQUID_TOKEN = process.env.REACT_APP_LIQUID_TOKEN ? process.env.REACT_APP_LIQUID_TOKEN : 'WIT';
