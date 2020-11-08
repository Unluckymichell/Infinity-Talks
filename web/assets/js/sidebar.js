$("#menu-toggle").click(function (e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

$.getJSON("/api/inftalks/guild/all", function (data) {
    for (var i in data) {
        var g = data[i].guild;
        $("<li/>", {
            html: '<a href="/guild.html?id=' + g.id + '">' + g.name + "</a>",
        }).appendTo("#sidebar_guilds");
    }
});
