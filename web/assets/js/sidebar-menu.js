$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

if (window.matchMedia('(max-width: 768px)').matches) {
    $("#wrapper").toggleClass("toggled");
}