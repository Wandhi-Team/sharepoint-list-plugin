/**
 * 获得文件列表
 * @returns {Promise<*[]>}
 */
const getFileList = async () => {
    let fileList = [];

    // 解析路径参数
    let url = document.location;
    let host = url.host;
    let param = new URLSearchParams(url.search);
    let loc = param.get('id');

    // 请求文件列表
    let response = await fetch(`https://${host}${loc}`, {
        method: 'PROPFIND',
        credentials: 'include'
    });
    if (!response.ok) {
        // 失败
        if (response.status !== 404) {
            throw new Error(`无法解析OneDrive文件列表: ${response.status}`);
        }
        // 获取单文件信息
        let directLink = encodeURI(`https://${host}${loc}`);
        let parts = loc.split('/');
        let filename = parts[parts.length - 1];
        // 单个文件
        fileList.push({filename, directLink});
    } else {
        // 成功：多个文件
        // 解析返回
        let xmlRaw = await response.text();
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(xmlRaw, "text/xml");
        let fileEls = xmlDoc.getElementsByTagName('D:response');
        for (const el of fileEls) {
            let isFolderEl = el.getElementsByTagName('D:isFolder');
            // 当前不支持递归查找，所以跳过文件夹
            if (isFolderEl.length >= 1 && isFolderEl[0].textContent === 't') {
                continue;
            }
            // 获得文件 URL
            let hrefEl = el.getElementsByTagName('D:href');
            let directLink = "";
            if (hrefEl.length >= 1) {
                directLink = encodeURI(decodeURI(hrefEl[0].textContent));
            }
            // 获得文件名
            let nameEl = el.getElementsByTagName('D:displayname');
            let filename = "";
            if (nameEl.length >= 1) {
                filename = nameEl[0].textContent;
            }
            // 拼接结果
            fileList.push({filename, directLink});
        }
    }

    return fileList;
};

/**
 * 获得 Cookie
 * @returns {Promise<unknown>}
 */
const getCookie = () => {
    return new Promise(function (resolve, reject) {
        GM_cookie.list({name: 'FedAuth'}, (cookie, error) => {
            if (error) {
                reject(error);
                return;
            }
            let token = cookie[0].value;
            resolve(`Cookie: FedAuth=${token}`);
        });
    });
};

/**
 * 复制到剪切板
 * @returns {Promise<boolean>}
 */
const setClipboard = (val) => {
    return new Promise(function (resolve) {
        GM_setClipboard(val, "text");
        resolve(true);
    });
}

const KEY_ARIA_CONF = "aria_conf";

/**
 * 取得 Aria 配置
 * @returns {{downloadPath: string, apiBase: string, token: string}}
 */
const getAriaConfig = () => {
    let json = GM_getValue(KEY_ARIA_CONF, "null");
    return JSON.parse(json);
};

/**
 * 设置 Aria 配置
 * @param conf
 */
const setAriaConfig = (conf) => {
    GM_setValue(KEY_ARIA_CONF, JSON.stringify(conf));
};

export default {
    getFileList,
    getCookie,
    setClipboard,
    getAriaConfig,
    setAriaConfig
}