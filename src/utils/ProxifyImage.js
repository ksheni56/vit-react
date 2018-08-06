import { AVATAR_PROXY } from '../config';

const NATURAL_SIZE = '0x0/';
const proxifyImage = (url, dimensions = false) => {
    const rProxyDomain = new RegExp('^' + AVATAR_PROXY, 'g');
    const rProxyDomainsDimensions = new RegExp(
        AVATAR_PROXY + '([0-9]+x[0-9]+)/',
        'g'
    );

    const proxyList = url.match(rProxyDomainsDimensions);
    let respUrl = url;
    if (proxyList) {
        const lastProxy = proxyList[proxyList.length - 1];
        respUrl = url.substring(url.lastIndexOf(lastProxy) + lastProxy.length);
    }
    if (dimensions && AVATAR_PROXY) {
        let dims = dimensions + '/';
        if (typeof dimensions !== 'string') {
            dims = proxyList
                ? proxyList.shift().match(/([0-9]+x[0-9]+)\//g)[0]
                : NATURAL_SIZE;
        }
        if (NATURAL_SIZE !== dims || !rProxyDomain.test(respUrl)) {
            return AVATAR_PROXY + dims + respUrl;
        }
    }
    return respUrl;
};

export default proxifyImage;
