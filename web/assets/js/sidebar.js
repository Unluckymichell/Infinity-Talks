$("#menu-toggle").click(function (e) {
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

$.getJSON("/api/inftalks/guild/all", function (data) {
  $("#login-message").remove();
  for (var i in data) {
    var g = data[i].guild;
    if (location.pathname == "/guild.html") {
      $("<li/>", {
        html:
          "<a onclick=\"guildClick('" +
          g.id +
          "')\">" +
           g.name +
          "</a>",
      })
        .addClass("sidebar-item")
        .appendTo("#sidebar_guilds");
    } else {
      $("<li/>", {
        html:
          '<a href="/guild.html?id=' +
          g.id +
          '">' +
          g.name +
          "</a>",
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
  }
});

function guildClick(id) {
  selectedGuild = id + "";
  window.history.pushState({}, null, location.pathname + "?id=" + id);
  $("#wrapper").removeClass("toggled");
  $("#sec_basic_settings").css("opacity", "0");
  $("#sec_category_settings").css("opacity", "0");
  $("#sec_no_categorys").css("opacity", "0");
  loadGuildData();
}
