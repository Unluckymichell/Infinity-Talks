$("#menu-toggle").click(function (e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

$.getJSON("/api/inftalks/guild/all", function (data) {
    for (var i in data) {
        var g = data[i].guild;
        $("<li/>", {
            html: '<a href="/guild.html?id=' + g.id + '">' + g.name + "</a>",
        })
            .addClass("sidebar-item")
            .click(function () {
                $("#wrapper").removeClass("toggled");
                $("#sec_basic_settings").css("opacity", "0");
                $("#sec_category_settings").css("opacity", "0");
                $("#sec_no_categorys").css("opacity", "0");
            })
            .appendTo("#sidebar_guilds");
    }
});
