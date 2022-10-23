//全局配置

//是否启用vkey和vkey的值。如Deno开了，这里一定要开。Deno没开，这里T/F都无所谓。
const enable_vkey = true
const vkey = 'NFvTu9KkLeOUnwJ'
//允许的传入域名，注意逗号
const list_allow_domains=["first.example.com","second.example.com","third.example.com"] 
//网页内容替换，注意逗号
const replace_dict = {
    '$upstream': '$custom_domain',
    '//google.com': '',
}
addEventListener('fetch', event => {
    event.respondWith(fetchAndApply(event.request));
})
async function fetchAndApply(request) {
    const user_agent = request.headers.get('user-agent');
    let response = null;
    let url = new URL(request.url);
    let url_host = url.host;
    //判断入站域名是否在运行列表里。
    if (list_allow_domains.lastIndexOf(url_host)!=-1){

        //入站域名和出站域名匹配，添加新的域名复制else if那段就行。
        if (url_host=="first.example.com"){
            const upstream = 'xxx.deno.dev'
            const upstream_mobile = 'xxx.deno.dev'
            if (await device_status(user_agent)) {
                var upstream_domain = upstream
            } else {
                var upstream_domain = upstream_mobile
            }
        }else if (url_host=="second.example.com"||url_host=="third.example.com"){
            const upstream = 'yyy.deno.dev' //电脑端域名
            const upstream_mobile = 'yyy.deno.dev'//移动端端域名
            if (await device_status(user_agent)) {
                var upstream_domain = upstream
            } else {
                var upstream_domain = upstream_mobile
            }
        }else{
            return new Response("Error: Config Error.", { headers: { "content-type": "text/plain" }})
        }

    
        url.host = upstream_domain;

        let method = request.method;
        let request_headers = request.headers;
        let new_request_headers = new Headers(request_headers);
        //url.href=url.href.replace('https://','http://');

        if (request.method === 'POST') {
            new_request_headers.set('Host', upstream_domain);
            new_request_headers.set('Referer', url.href);
            new_request_headers.set('Origin', "https://"+upstream);

            if (enable_vkey == true){new_request_headers.set('c9bgmkuSJ0sX5Kw', vkey);}

            var original_response = await fetch(url.href, {
                method: 'POST',
                headers: new_request_headers,
                body : request.body
            })
        }
        else{
        new_request_headers.set('Host', upstream_domain);
        new_request_headers.set('Referer', url.href);
        
        if (enable_vkey == true){new_request_headers.set('c9bgmkuSJ0sX5Kw', vkey);}
        
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

        //if (enable_vkey == true){new_response_headers.delete('c9bgmkuSJ0sX5Kw')}

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
    }else{
        return new Response("Error: Invalid Domain", { headers: { "content-type": "text/plain" }})
    }
 
}


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
