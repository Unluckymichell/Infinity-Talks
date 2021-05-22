location.query = {};
var query = location.search.replace("?", "").split("&");
for (const q of query) {
    var qq = q.split("=");

    if(qq.length == 2 && qq[1] != "") location.query[qq[0]] = qq[1];
    else if(qq.length == 1 && qq[0] != "") location.query[qq[0]] = true;
}

function buildSearchString(query) {
    var search = [];
    for(var i in query) {
        if(query[i] === true) search.push(i);
        else search.push(i + "=" + query[i]);
    }
    return "?" + search.join("&");
}