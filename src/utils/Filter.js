export const shouldDisplayPost = (state, post) => {
    let displayPost = false;

    try {
        if ((JSON.parse(post.json_metadata).tags &&
                JSON.parse(post.json_metadata).tags.includes('touch-tube')) &&
                JSON.parse(post.json_metadata).vit_data.Hash &&
                JSON.parse(post.json_metadata).vit_data.Playlist &&
                !state.blockedUsers.includes(post.author) &&
                !state.dmcaContents.includes(`@${post.author}/${post.permlink}`)) {
            displayPost = true
        }
    } catch(e) {
        // do something?; likely not a related post anyway
    }

    return displayPost
}
