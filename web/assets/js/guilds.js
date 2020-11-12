var guildData = {};
var localGuildData = {};
var selectedCategory = null;
var selectedTChannel = null;
var errors = {
    setting_prefix_error: false,
    setting_category_channelLimit_error: false,
    setting_category_channelUserLimit_error: false,
    setting_category_namingRule_error: false,
};

if (location.pathname == "/guild.html") {
    $("#save_button").click(function (e) {
        e.preventDefault();
        saveGuildData();
    });

    $("#undo_button").click(function (e) {
        e.preventDefault();
        undoGuildData();
    });

    $(".settings.value").each(function () {
        $(this).change(function (e) {
            var element = $(e.currentTarget);
            switch (element.prop("id")) {
                case "setting_language":
                    console.log("guild.language: " + element.val());
                    localGuildData.guild.language = "" + element.val();
                    break;
                case "setting_prefix":
                    console.log("guild.prefix: " + element.val().trimLeft());
                    localGuildData.guild.prefix = "" + element.val().trimLeft();
                    break;
                case "setting_category":
                    console.log("selectedCategory.id: " + element.val());
                    selectedCategory = null;
                    selectedCategory = localGuildData.guild.categorys.find(
                        function (c) {
                            return c.id == element.val();
                        }
                    );
                    break;
                case "setting_category_enable":
                    console.log(
                        "selectedCategory.enableInfTalks: " +
                            element.is(":checked")
                    );
                    selectedCategory.enableInfTalks = element.is(":checked");
                    break;
                case "setting_category_allowLock":
                    console.log(
                        "selectedCategory.allowLock: " + element.is(":checked")
                    );
                    selectedCategory.allowLock = element.is(":checked");
                    break;
                case "setting_category_channelLimit":
                    console.log(
                        "selectedCategory.channelLimit: " + element.val()
                    );
                    selectedCategory.channelLimit = parseInt(element.val());
                    if (isNaN(selectedCategory.channelLimit))
                        selectedCategory.channelLimit = 0;
                    break;
                case "setting_category_channelUserLimit":
                    console.log(
                        "selectedCategory.channelUserLimit: " + element.val()
                    );
                    selectedCategory.channelUserLimit = parseInt(element.val());
                    if (isNaN(selectedCategory.channelUserLimit))
                        selectedCategory.channelUserLimit = 0;
                    break;
                case "setting_category_namingRule":
                    console.log(
                        "selectedCategory.namingRule: " + element.val().trim()
                    );
                    selectedCategory.namingRule = "" + element.val().trim();
                    break;
            }
            updateData();
        });
    });

    loadGuildData();
}

function loadGuildData() {
    $.getJSON("/api/inftalks/guild?id=" + location.query.id, function (data) {
        // Store data
        localGuildData = data;
        guildData = $.extend(true, {}, localGuildData);
        if (localGuildData.guild.categorys.length > 0)
            selectedCategory = localGuildData.guild.categorys[0];
        if (localGuildData.guild.textChannels.length > 0)
            selectedTChannel = localGuildData.guild.textChannels[0];
        updateData();
    });
}

function saveGuildData() {
    guildData = $.extend(true, {}, localGuildData);
    $.ajax("/api/inftalks/guild?id=" + location.query.id, {
        data: JSON.stringify(guildData),
        contentType: "application/json",
        type: "POST",
    })
        .fail(function (err) {
            if (err.responseJSON.error == "No token!") location.reload();
            console.log(err);
        })
        .done(function (data) {
            updateData();
        });
}

function undoGuildData() {
    localGuildData = $.extend(true, {}, guildData);
    if (localGuildData.guild.categorys.length > 0)
        selectedCategory = localGuildData.guild.categorys[0];
    else selectedCategory = null;
    if (localGuildData.guild.textChannels.length > 0)
        selectedTChannel = localGuildData.guild.textChannels[0];
    else selectedCategory = null;
    updateData();
}

function updateData() {
    // var_guild
    $(".var_guild").each(function () {
        this.innerText = localGuildData.guild.name;
    });

    // setting_language
    var setting_language = $("#setting_language");
    setting_language.empty();
    for (var l of localGuildData.langlist) {
        if (l.key != "default") {
            var n = $("<option/>").prop("value", l.key).text(l.langName);
            if (localGuildData.guild.language == l.key) {
                n.prop("selected", true);
            }
            n.appendTo(setting_language);
        }
    }

    // setting_prefix
    $("#setting_prefix").prop("value", localGuildData.guild.prefix);
    errors.setting_prefix_error = localGuildData.guild.prefix == "";

    // Show basic settings
    $("#sec_basic_settings").css("opacity", "1");

    // setting_category
    if (localGuildData.guild.categorys.length > 0) {
        var setting_category = $("#setting_category");
        setting_category.empty();
        var ci = 0;
        for (var c of localGuildData.guild.categorys) {
            var n = $("<option/>")
                .prop("value", c.id)
                .text(ci + ": " + c.name);
            if (c.id == selectedCategory.id) {
                n.prop("selected", true);
            }
            n.appendTo(setting_category);
            ci++;
        }

        // setting_category_enable
        $("#setting_category_enable").prop(
            "checked",
            selectedCategory.enableInfTalks
        );

        // setting_category_allowLock
        $("#setting_category_allowLock")
            .prop("checked", selectedCategory.allowLock)
            .prop("disabled", !selectedCategory.enableInfTalks);
        $("#setting_category_allowLock_wrapper")[
            selectedCategory.enableInfTalks ? "removeClass" : "addClass"
        ]("disabled");

        // setting_category_channelLimit
        $("#setting_category_channelLimit")
            .val(selectedCategory.channelLimit)
            .prop("disabled", !selectedCategory.enableInfTalks)
            [selectedCategory.enableInfTalks ? "removeClass" : "addClass"](
                "disabled"
            );
        errors.setting_category_channelLimit_error =
            selectedCategory.channelLimit < 0;

        // setting_category_channelUserLimit
        $("#setting_category_channelUserLimit")
            .val(selectedCategory.channelUserLimit)
            .prop("disabled", !selectedCategory.enableInfTalks)
            [selectedCategory.enableInfTalks ? "removeClass" : "addClass"](
                "disabled"
            );
        errors.setting_category_channelUserLimit_error =
            selectedCategory.channelUserLimit < 0 ||
            selectedCategory.channelUserLimit > 99;

        // setting_category_namingRule
        $("#setting_category_namingRule")
            .val(selectedCategory.namingRule)
            .prop("disabled", !selectedCategory.enableInfTalks)
            [selectedCategory.enableInfTalks ? "removeClass" : "addClass"](
                "disabled"
            );
        $("#setting_category_namingRule_tip").text(
            selectedCategory.namingRule.length + " / 500"
        );
        errors.setting_category_namingRule_error =
            selectedCategory.namingRule.length > 500;

        // Show category settings
        $("#sec_category_settings").css("opacity", "1");
        $("#sec_no_categorys").hide();
    } else {
        $("#sec_category_settings").hide();
        $("#sec_no_categorys").css("opacity", "1");
    }

    // errors
    for (err in errors) {
        $("#" + err)[errors[err] ? "show" : "hide"]();
    }

    // tips
    $("#setting_category_namingRule_tip")[
        errors.setting_category_namingRule_error ? "addClass" : "removeClass"
    ]("error");

    // snackbar (update toast)
    var iie = isInEquivalent(localGuildData.guild, guildData.guild);
    if (iie) {
        $("#snackbar").addClass("show");
        $("#div_location").text(iie.location);
    } else $("#snackbar").removeClass("show");
    if (
        errors.setting_category_channelLimit_error ||
        errors.setting_category_channelUserLimit_error ||
        errors.setting_prefix_error ||
        errors.setting_category_namingRule_error
    )
        $("#save_button").prop("disabled", true);
    else $("#save_button").prop("disabled", false);
}

function isInEquivalent(a, b, p) {
    if (typeof p != "string") p = "guild";
    if (Array.isArray(a) != Array.isArray(b)) return { location: p };
    if (Array.isArray(a)) {
        for (var i = 0; i < a.length; i++) {
            var av = a[i];
            var bv = b[i];

            if (typeof av != typeof bv) return { location: p + "[" + i + "]" };

            if (typeof av == "object") {
                var iie = isInEquivalent(av, bv, p + "[" + i + "]");
                if (iie) return iie;
            } else if (av != bv) return { location: p + "[" + i + "]" };
        }
    } else {
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);

        if (aProps.length != bProps.length) {
            return { location: p };
        }

        for (var i = 0; i < aProps.length; i++) {
            var propName = aProps[i];
            var av = a[propName];
            var bv = b[propName];

            if (typeof av != typeof bv) return { location: p + "." + propName };
            if (typeof av == "object") {
                var iie = isInEquivalent(av, bv, p + "." + propName);
                if (iie) return iie;
            } else if (av != bv) return { location: p + "." + propName };
        }
    }

    return false;
}
