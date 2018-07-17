const initialState = {
    search_sidebar: false,
    query: ""
};

export default function(state = initialState, action) {

    switch(action.type) {

        case 'toggle_search_sidebar':

            return Object.assign({}, state, {
                search_sidebar: action.payload.search_sidebar,
                query: action.payload.query,
            });

        default:
        
            return state;

    }

}
