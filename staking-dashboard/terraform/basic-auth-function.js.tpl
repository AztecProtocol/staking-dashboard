function toBase64(str) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var output = '';
    var i = 0;
    while (i < str.length) {
        var c1 = str.charCodeAt(i++);
        var c2 = str.charCodeAt(i++);
        var c3 = str.charCodeAt(i++);
        var e1 = c1 >> 2;
        var e2 = ((c1 & 3) << 4) | (c2 >> 4);
        var e3 = ((c2 & 15) << 2) | (c3 >> 6);
        var e4 = c3 & 63;
        if (isNaN(c2)) { e3 = e4 = 64; }
        else if (isNaN(c3)) { e4 = 64; }
        output += chars.charAt(e1) + chars.charAt(e2) +
                  chars.charAt(e3) + chars.charAt(e4);
    }
    return output;
}

function handler(event) {
    var request = event.request;
    var headers = request.headers;

    var authUser = "${basic_auth_user}";
    var authPass = "${basic_auth_pass}";
    var expectedAuth = "Basic " + toBase64(authUser + ":" + authPass);

    if (headers.authorization && headers.authorization.value === expectedAuth) {
        return request;
    }

    return {
        statusCode: 401,
        statusDescription: "Unauthorized",
        headers: {
            "www-authenticate": { value: 'Basic realm="Secure Area"' }
        }
    };
}

