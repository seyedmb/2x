const domains = {
    "deno-1.e.com": ["1.1.1.1:443","1.1.1.1:443"],
    "deno-2.e.com": ["1.1.1.1:443","1.1.1.1:443"],
    "xxx.deno.dev": ["1.1.1.1:443","1.1.1.1:443"],
}
const replace_dict = {
    '$upstream': '$custom_domain',
    '//google.com': '',
    'http://mtyxt.deno.dev':'https://mtyxt.deno.dev',
}
addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
})
async function replace_response_text(response, upstream_domain, host_name) {
    let text = await response.text()
    var i, j;
    for (i in replace_dict) {
        j = replace_dict[i]
        if (i == '$upstream') {
            i = upstream_domain
        } else if (i == '$custom_domain') {
            i = host_name
        }
        if (j == '$upstream') {
            j = upstream_domain
        } else if (j == '$custom_domain') {
            j = host_name
        }
        let re = new RegExp(i, 'g')
        text = text.replace(re, j);
    }
    return text;
}
async function device_status (user_agent_info) {
    var agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
    var flag = true;
    for (var v = 0; v < agents.length; v++) {
        if (user_agent_info.indexOf(agents[v]) > 0) {
            flag = false;
            break;
        }
    }
    return flag;
}
async function fetchAndApply(request) {
    const user_agent = request.headers.get('user-agent');
    
    let response = null;
    let url = new URL(request.url);
    let url_host = url.host;
    const infllow_domain = url.host;
    if (domains.hasOwnProperty(infllow_domain)==false){
        return new Response("Error: Invalid Infollow Domain To Deno, Check Domain List In Deno.", { headers: { "content-type": "text/plain" }})
    }else{
        var upstream =domains[infllow_domain][0]
        var upstream_mobile = domains[infllow_domain][1]
    }
    if (await device_status(user_agent)) {
            var upstream_domain = upstream
        } else {
            var upstream_domain = upstream_mobile
        }
    url.host = upstream_domain;
    let method = request.method;
    let request_headers = request.headers;
    let new_request_headers = new Headers(request_headers);
    url.href=url.href.replace('https://','http://');
        if (request.method === 'POST') {
            new_request_headers.set('Host', upstream_domain);
            new_request_headers.set('Referer', url.href);
            new_request_headers.set('Origin', "http://"+upstream);
            var original_response = await fetch(url.href, {
                method: 'POST',
                headers: new_request_headers,
                body : request.body
            })
        }
        else{
        new_request_headers.set('Host', upstream_domain);
        new_request_headers.set('Referer', url.href);
        var original_response = await fetch(url.href, {
            method: method,
            headers: new_request_headers
        })
        }
        let original_response_clone = original_response.clone();
        let original_text = null;
        let response_headers = original_response.headers;
        let new_response_headers = new Headers(response_headers);
        let status = original_response.status;
        new_response_headers.set('access-control-allow-origin', '*');
        new_response_headers.set('access-control-allow-credentials', true);
        new_response_headers.delete('content-security-policy');
        new_response_headers.delete('content-security-policy-report-only');
        new_response_headers.delete('clear-site-data');
        new_response_headers.delete('cf_domain');
        const content_type = new_response_headers.get('content-type');
        if (content_type==null){original_text = original_response_clone.body}
        else if (content_type.includes('text/html') && content_type.includes('UTF-8')) {
            original_text = await replace_response_text(original_response_clone, upstream_domain, url_host);
        } else {
            original_text = original_response_clone.body
        }
        response = new Response(original_text, {
            status,
            headers: new_response_headers
        })
        return response;
    }
