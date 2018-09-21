import store from './../reducers';
import Config from './../config.json';

export function ToggleSearchSidebar(request) {

    return {
        type: 'toggle_search_sidebar',
        payload: request
    };

}
