export const shouldDisplayPost = (state, post, loadedPosts=[]) => {
    let displayPost = false;

    try {
        var jsonMetadata = JSON.parse(post.json_metadata)

        var postHashes = loadedPosts.map((post) => {return JSON.parse(post.json_metadata).vit_data.Hash})
        if (postHashes.includes(jsonMetadata.vit_data.Hash)) { console.log('duplicate post found');return displayPost }

        if ((jsonMetadata.tags && jsonMetadata.tags.includes('touch-tube')) &&
                (jsonMetadata.vit_data.Hash && jsonMetadata.vit_data.Playlist) &&
                !state.blockedUsers.includes(post.author) &&
                !state.dmcaContents.includes(`@${post.author}/${post.permlink}`)) {
            displayPost = true
        }
    } catch(e) {
        // do something?; likely not a related post anyway
    }

    return displayPost
}
